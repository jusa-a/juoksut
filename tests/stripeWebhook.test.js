import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { createEvent } from 'h3'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../server/api/stripe-webhook'
import { releaseExpiredReservations, releaseReservationGroup, reserveItems } from '../server/utils/checkoutReservations'

const stripe = vi.hoisted(() => ({ listLineItems: vi.fn() }))

vi.mock('stripe', () => ({
  default: class {
    webhooks = { constructEventAsync: async rawBody => JSON.parse(rawBody) }
    checkout = { sessions: { listLineItems: stripe.listLineItems } }
  },
}))

const HOUR = 60 * 60
const NOW = Math.floor(Date.now() / 1000)
const GROUP = 'group-1'
const CAMP = { productSlug: 'camp', size: 'STANDARD', quantity: 1 }

// Stripe's page size is 10 unless the call says otherwise.
function stubLineItems(lines) {
  stripe.listLineItems.mockImplementation(async (_sessionId, { limit = 10 } = {}) => ({ data: lines.slice(0, limit) }))
}

function teeLine(size, quantity) {
  return { quantity, price: { id: `price_inline_${size}`, metadata: {}, product: { metadata: { slug: 'tee', size } } } }
}

// A pre-created Price carries no size metadata, so the webhook resolves it to ONE-SIZE.
const CAMP_LINE = { quantity: 1, price: { id: 'price_camp', metadata: {}, product: { metadata: {} } } }

function createD1() {
  const db = new DatabaseSync(':memory:')
  db.exec(readFileSync('d1/schema.sql', 'utf8'))

  const execute = ({ sql, params }) => {
    const statement = db.prepare(sql)
    if (/^\s*SELECT/i.test(sql))
      return { results: statement.all(...params), meta: { changes: 0 } }
    return { results: [], meta: { changes: Number(statement.run(...params).changes) } }
  }
  const prepared = (sql, params = []) => ({
    sql,
    params,
    bind: (...values) => prepared(sql, values),
    run: async () => execute({ sql, params }),
    first: async () => execute({ sql, params }).results[0] ?? null,
  })

  return {
    db,
    failNextDecrement: false,
    prepare: sql => prepared(sql),
    async batch(statements) {
      if (statements.length === 0)
        throw new Error('Empty batch')
      if (this.failNextDecrement && statements.some(({ sql }) => sql.includes('quantity = quantity - ?'))) {
        this.failNextDecrement = false
        throw new Error('D1 is unavailable')
      }

      db.exec('BEGIN')
      try {
        const results = statements.map(execute)
        db.exec('COMMIT')
        return results
      }
      catch (error) {
        db.exec('ROLLBACK')
        throw error
      }
    },
  }
}

describe('stripe webhook and limited-place holds', () => {
  let D1

  const stock = (slug, size) => D1.db.prepare('SELECT quantity FROM stock WHERE product_slug = ? AND size = ?').get(slug, size).quantity
  const setStock = (slug, size, quantity) => D1.db.prepare('UPDATE stock SET quantity = ? WHERE product_slug = ? AND size = ?').run(quantity, slug, size)
  const holdStatus = (groupId = GROUP) => D1.db.prepare('SELECT status FROM checkout_reservations WHERE group_id = ?').get(groupId).status
  const hold = (groupId = GROUP, expiresAt = NOW + HOUR) => reserveItems(D1, groupId, [CAMP], expiresAt)

  async function deliver(type, { groupId = GROUP, id = 'evt_1' } = {}) {
    const rawBody = JSON.stringify({
      id,
      type,
      data: { object: { id: 'cs_test', client_reference_id: groupId, customer_details: { email: 'runner@example.com' } } },
    })
    const event = createEvent({ method: 'POST', url: '/api/stripe-webhook', headers: { 'stripe-signature': 'signed' }, body: rawBody }, {})
    event.context.cloudflare = { env: { D1 } }

    try {
      return { status: 200, body: await handler(event) }
    }
    catch (error) {
      return { status: error.statusCode, body: null }
    }
  }

  const complete = options => deliver('checkout.session.completed', options)

  beforeEach(() => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'test-key')
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'test-secret')
    vi.spyOn(console, 'error').mockImplementation(() => {})
    stripe.listLineItems.mockReset()

    D1 = createD1()
    D1.db.exec(`
      INSERT INTO products (slug, title, stripe_price_id, reserve_stock) VALUES
        ('camp', 'Camp', 'price_camp', 1),
        ('tee', 'Tee', NULL, 0);
      INSERT INTO stock (product_slug, size, quantity) VALUES
        ('camp', 'STANDARD', 3),
        ('tee', 'M', 10);
    `)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  describe('late payments', () => {
    it('honours a payment for a released hold and never releases it again', async () => {
      stubLineItems([CAMP_LINE])
      await hold()
      await releaseReservationGroup(D1, GROUP)
      expect(stock('camp', 'STANDARD')).toBe(3)

      const response = await complete()

      expect(response.status).toBe(200)
      expect(holdStatus()).toBe('paid')
      expect(stock('camp', 'STANDARD')).toBe(2)
      expect(console.error).not.toHaveBeenCalled()

      await releaseReservationGroup(D1, GROUP)
      await releaseExpiredReservations(D1, NOW + 24 * HOUR)
      expect(stock('camp', 'STANDARD')).toBe(2)
    })

    it('keeps stock at 0 and logs the oversell when the last place was resold', async () => {
      stubLineItems([CAMP_LINE])
      setStock('camp', 'STANDARD', 1)
      await hold()
      await releaseReservationGroup(D1, GROUP)
      await hold('group-2')
      expect(stock('camp', 'STANDARD')).toBe(0)

      const response = await complete()

      expect(response.status).toBe(200)
      expect(holdStatus()).toBe('paid')
      expect(stock('camp', 'STANDARD')).toBe(0)

      const logged = console.error.mock.calls.flat().join(' ')
      expect(logged).toContain(GROUP)
      expect(logged).toContain('camp')
      expect(logged).not.toContain('runner@example.com')
    })

    it('leaves a coming-soon quantity alone', async () => {
      stubLineItems([CAMP_LINE])
      await hold()
      await releaseReservationGroup(D1, GROUP)
      setStock('camp', 'STANDARD', -1)

      const response = await complete()

      expect(response.status).toBe(200)
      expect(holdStatus()).toBe('paid')
      expect(stock('camp', 'STANDARD')).toBe(-1)
    })
  })

  describe('releasing expired holds', () => {
    it('clean-up leaves a hold expired under an hour ago and releases one past it', async () => {
      await hold('recent', NOW - HOUR + 60)
      await hold('old', NOW - HOUR - 60)

      await releaseExpiredReservations(D1, NOW)

      expect(holdStatus('recent')).toBe('active')
      expect(holdStatus('old')).toBe('released')
      expect(stock('camp', 'STANDARD')).toBe(2)
    })

    it('an expired webhook releases at once a hold the clean-up still leaves', async () => {
      await hold(GROUP, NOW - 60)
      await releaseExpiredReservations(D1, NOW)
      expect(holdStatus()).toBe('active')

      const response = await deliver('checkout.session.expired')

      expect(response.status).toBe(200)
      expect(holdStatus()).toBe('released')
      expect(stock('camp', 'STANDARD')).toBe(3)
    })
  })

  describe('carts with a limited place', () => {
    it('decrements the merch lines and not the held place', async () => {
      stubLineItems([CAMP_LINE, teeLine('M', 2)])
      await hold()
      expect(stock('camp', 'STANDARD')).toBe(2)

      const response = await complete()

      expect(response.status).toBe(200)
      expect(holdStatus()).toBe('paid')
      expect(stock('tee', 'M')).toBe(8)
      expect(stock('camp', 'STANDARD')).toBe(2)
    })

    it('marks a cart of only a limited place paid with no stock change', async () => {
      stubLineItems([CAMP_LINE])
      await hold()

      const response = await complete()

      expect(response.status).toBe(200)
      expect(stripe.listLineItems).toHaveBeenCalledOnce()
      expect(holdStatus()).toBe('paid')
      expect(stock('camp', 'STANDARD')).toBe(2)
    })

    it('counts stock once when a retry follows a failed stock batch', async () => {
      stubLineItems([CAMP_LINE, teeLine('M', 2)])
      await hold()
      D1.failNextDecrement = true

      expect((await complete()).status).toBe(500)
      expect(holdStatus()).toBe('paid')
      expect(stock('tee', 'M')).toBe(10)

      expect((await complete()).status).toBe(200)
      expect(stock('tee', 'M')).toBe(8)
      expect(stock('camp', 'STANDARD')).toBe(2)
    })

    it('takes a late place back once when a retry follows a failed stock batch', async () => {
      stubLineItems([CAMP_LINE, teeLine('M', 2)])
      await hold()
      await releaseReservationGroup(D1, GROUP)
      D1.failNextDecrement = true

      expect((await complete()).status).toBe(500)
      expect((await complete()).status).toBe(200)

      expect(stock('camp', 'STANDARD')).toBe(2)
      expect(stock('tee', 'M')).toBe(8)
      expect(holdStatus()).toBe('paid')
    })

    it('counts stock once when a retry follows a missing stock row', async () => {
      stubLineItems([CAMP_LINE, teeLine('M', 2), teeLine('XXL', 1)])
      await hold()

      expect((await complete()).status).toBe(500)
      expect((await complete()).status).toBe(500)
      expect(stock('tee', 'M')).toBe(10)

      D1.db.exec(`INSERT INTO stock (product_slug, size, quantity) VALUES ('tee', 'XXL', 5)`)

      expect((await complete()).status).toBe(200)
      expect(stock('tee', 'M')).toBe(8)
      expect(stock('tee', 'XXL')).toBe(4)
    })
  })

  describe('line items', () => {
    it('reads the whole cart in one page and decrements all 11 lines', async () => {
      const sizes = Array.from({ length: 11 }, (_, index) => `SIZE-${index}`)
      for (const size of sizes)
        D1.db.prepare(`INSERT INTO stock (product_slug, size, quantity) VALUES ('tee', ?, 5)`).run(size)
      stubLineItems(sizes.map(size => teeLine(size, 1)))

      const response = await complete({ groupId: null })

      expect(response.status).toBe(200)
      expect(stripe.listLineItems).toHaveBeenCalledWith('cs_test', expect.objectContaining({ limit: 100 }))
      expect(sizes.map(size => stock('tee', size))).toEqual(sizes.map(() => 4))
    })
  })
})
