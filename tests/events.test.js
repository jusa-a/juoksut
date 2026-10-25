import process from 'node:process'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { confirmedEmail, promotedEmail, waitlistEmail } from '../server/utils/eventEmails'
import {
  cancelSignup,
  EventSignupError,
  getPublishedPage,
  getSignupByToken,
  promoteWaitlist,
  purgeOldSignups,
  signUp,
} from '../server/utils/events'
import { helsinkiToUnix, resolveEventTimes, unixToHelsinki } from '../server/utils/helsinkiTime'
import { verifyTurnstile } from '../server/utils/turnstile'
import { createD1 } from './helpers/d1Shim'

let db
let pageCount

const originalTurnstileSecret = process.env.TURNSTILE_SECRET_KEY

beforeEach(() => {
  db = createD1()
  pageCount = 0
})

afterEach(() => {
  vi.unstubAllGlobals()
  if (originalTurnstileSecret === undefined)
    delete process.env.TURNSTILE_SECRET_KEY
  else
    process.env.TURNSTILE_SECRET_KEY = originalTurnstileSecret
})

function tokenFor(n) {
  return n.toString(16).padStart(32, '0')
}

async function addPage({ title = 'Test Event', published = 1 } = {}) {
  pageCount++
  const slug = `page-${pageCount}`
  const { meta } = await db.prepare(`
    INSERT INTO event_pages (slug, title, body, summary, published, venue, details, capacity, start_time, opens_rule, promote_rule)
    VALUES (?, ?, 'Body', 'Summary', ?, 'Test Hall', 'Meet at the north door.', 40, '16:30', 'monday 12:00', 'same-day 12:00')
  `).bind(slug, title, published).run()
  return { id: meta.last_row_id, slug, title }
}

async function addEvent({
  page,
  capacity = 2,
  startsAt = 10000,
  opensAt = 0,
  promoteUntil = startsAt,
  venue = 'Test Hall',
  details = 'Meet at the north door.',
  title = 'Test Event',
} = {}) {
  const target = page || await addPage({ title })
  const { meta } = await db.prepare(`
    INSERT INTO events (page_id, starts_at, venue, details, capacity, opens_at, promote_until)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(target.id, startsAt, venue, details, capacity, opensAt, promoteUntil).run()
  return { eventId: meta.last_row_id, page: target }
}

function signUpPerson(eventId, person, now = 1000) {
  return signUp(db, {
    eventId,
    name: `Person ${person}`,
    email: `person${person}@example.com`,
    token: tokenFor(person),
    now,
  })
}

async function statuses(eventId) {
  const { results } = await db.prepare(`
    SELECT email, status FROM signups
    WHERE event_id = ?
    ORDER BY created_at, id
  `).bind(eventId).all()
  return results.map(row => `${row.email}:${row.status}`)
}

describe('event signups', () => {
  it('fills confirmed spots up to capacity, then waitlists', async () => {
    const { eventId, page } = await addEvent({ capacity: 2 })

    expect((await signUpPerson(eventId, 1)).status).toBe('confirmed')
    expect((await signUpPerson(eventId, 2)).status).toBe('confirmed')
    expect((await signUpPerson(eventId, 3)).status).toBe('waitlist')

    const result = await getPublishedPage(db, page.slug, 1000)
    expect(result.events).toEqual([{
      id: eventId,
      startsAt: 10000,
      venue: 'Test Hall',
      opensAt: 0,
      state: 'full',
      spotsLeft: null,
    }])
    // The public listing never exposes signup rows or the real capacity.
    expect(JSON.stringify(result)).not.toContain('@')
  })

  it('shows spots left only within ten of capacity', async () => {
    const page = await addPage()
    const nearFull = await addEvent({ page, capacity: 40, startsAt: 5000 })
    const roomy = await addEvent({ page, capacity: 40, startsAt: 6000 })
    const full = await addEvent({ page, capacity: 40, startsAt: 7000 })

    for (let person = 1; person <= 30; person++)
      await signUpPerson(nearFull.eventId, person)
    for (let person = 31; person <= 59; person++)
      await signUpPerson(roomy.eventId, person)
    for (let person = 60; person <= 99; person++)
      await signUpPerson(full.eventId, person)

    const result = await getPublishedPage(db, page.slug, 1000)
    expect(result.events.map(event => [event.spotsLeft, event.state]))
      .toEqual([[10, 'open'], [null, 'open'], [null, 'full']])
    expect(Object.keys(result.events[0]))
      .toEqual(['id', 'startsAt', 'venue', 'opensAt', 'state', 'spotsLeft'])
  })

  it('never exceeds capacity under 60 concurrent signups', async () => {
    const { eventId } = await addEvent({ capacity: 40 })

    const results = await Promise.all(
      Array.from({ length: 60 }, (_, index) => signUpPerson(eventId, index + 1)),
    )

    expect(results.filter(result => result.status === 'confirmed')).toHaveLength(40)
    expect(results.filter(result => result.status === 'waitlist')).toHaveLength(20)

    const { results: waitlisted } = await db.prepare(`
      SELECT email FROM signups
      WHERE event_id = ? AND status = 'waitlist'
      ORDER BY created_at, id
    `).bind(eventId).all()

    expect(waitlisted.map(row => row.email))
      .toEqual(Array.from({ length: 20 }, (_, index) => `person${index + 41}@example.com`))
  })

  it('rejects signups before opening and treats a started event as gone', async () => {
    const { eventId } = await addEvent({ capacity: 5, opensAt: 1000, startsAt: 5000 })

    await expect(signUpPerson(eventId, 1, 999)).rejects.toMatchObject({ code: 'not_open' })
    expect(await statuses(eventId)).toEqual([])

    expect((await signUpPerson(eventId, 1, 1000)).status).toBe('confirmed')
    await expect(signUpPerson(eventId, 2, 5000)).rejects.toMatchObject({ code: 'not_found' })
  })

  it('rejects an unknown event', async () => {
    await expect(signUpPerson(999, 1)).rejects.toBeInstanceOf(EventSignupError)
    await expect(signUpPerson(999, 1)).rejects.toMatchObject({ code: 'not_found' })
  })

  it('rejects a duplicate email', async () => {
    const { eventId } = await addEvent({ capacity: 5 })
    await signUpPerson(eventId, 1)

    await expect(signUpPerson(eventId, 1)).rejects.toMatchObject({ code: 'already_signed_up' })
  })

  it('cancels only before the event starts', async () => {
    const { eventId } = await addEvent({ capacity: 2, startsAt: 5000 })
    await signUpPerson(eventId, 1)
    await signUpPerson(eventId, 2)

    expect(await cancelSignup(db, tokenFor(2), 5000)).toEqual({ cancelled: false, promoted: [] })
    expect(await statuses(eventId)).toEqual([
      'person1@example.com:confirmed',
      'person2@example.com:confirmed',
    ])

    expect(await cancelSignup(db, tokenFor(1), 4999)).toEqual({ cancelled: true, promoted: [] })
    expect(await statuses(eventId)).toEqual([
      'person1@example.com:cancelled',
      'person2@example.com:confirmed',
    ])
  })

  it('promotes the oldest waitlisted person before promote_until', async () => {
    const { eventId } = await addEvent({ capacity: 1, startsAt: 5000, promoteUntil: 4000 })
    await signUpPerson(eventId, 1)
    await signUpPerson(eventId, 2)

    expect(await cancelSignup(db, tokenFor(1), 3999)).toEqual({
      cancelled: true,
      promoted: [{
        name: 'Person 2',
        email: 'person2@example.com',
        token: tokenFor(2),
        event_id: eventId,
      }],
    })
    expect(await statuses(eventId)).toEqual([
      'person1@example.com:cancelled',
      'person2@example.com:confirmed',
    ])
  })

  it('stops promoting at promote_until and leaves the freed spot to the next signup', async () => {
    const { eventId } = await addEvent({ capacity: 1, startsAt: 5000, promoteUntil: 4000 })
    await signUpPerson(eventId, 1)
    await signUpPerson(eventId, 2)

    expect(await cancelSignup(db, tokenFor(1), 4000)).toEqual({ cancelled: true, promoted: [] })
    expect((await signUpPerson(eventId, 3, 4001)).status).toBe('confirmed')
    expect(await statuses(eventId)).toEqual([
      'person1@example.com:cancelled',
      'person2@example.com:waitlist',
      'person3@example.com:confirmed',
    ])
  })

  it('lets a cancelled person sign up again with a new name, token and place in the queue', async () => {
    const { eventId } = await addEvent({ capacity: 1, startsAt: 5000 })
    await signUpPerson(eventId, 1)
    await signUpPerson(eventId, 2)
    await signUpPerson(eventId, 3)

    const cancelled = await cancelSignup(db, tokenFor(1), 2000)
    expect(cancelled.cancelled).toBe(true)
    expect(cancelled.promoted[0].email).toBe('person2@example.com')

    const again = await signUp(db, {
      eventId,
      name: 'Person One',
      email: 'person1@example.com',
      token: tokenFor(50),
      now: 3000,
    })
    expect(again).toEqual({ status: 'waitlist', token: tokenFor(50) })

    const stored = await db.prepare(
      'SELECT name, token FROM signups WHERE event_id = ? AND email = ?',
    ).bind(eventId, 'person1@example.com').first()
    expect(stored).toEqual({ name: 'Person One', token: tokenFor(50) })

    expect(await statuses(eventId)).toEqual([
      'person2@example.com:confirmed',
      'person3@example.com:waitlist',
      'person1@example.com:waitlist',
    ])
  })

  it('promotes the two oldest waitlisted people after capacity is raised', async () => {
    const { eventId } = await addEvent({ capacity: 1, startsAt: 5000 })
    await signUpPerson(eventId, 1)
    await signUpPerson(eventId, 2)
    await signUpPerson(eventId, 3, 1001)
    await signUpPerson(eventId, 4, 1002)

    await db.prepare('UPDATE events SET capacity = 3 WHERE id = ?').bind(eventId).run()

    const promoted = await promoteWaitlist(db, eventId, 2000)
    expect(promoted.map(row => row.email)).toEqual(['person2@example.com', 'person3@example.com'])
    expect(await statuses(eventId)).toEqual([
      'person1@example.com:confirmed',
      'person2@example.com:confirmed',
      'person3@example.com:confirmed',
      'person4@example.com:waitlist',
    ])
  })

  it('hides unpublished pages and lists only upcoming events with no signup data', async () => {
    const page = await addPage({ published: 0 })
    expect(await getPublishedPage(db, page.slug, 1000)).toBeNull()

    await db.prepare('UPDATE event_pages SET published = 1 WHERE id = ?').bind(page.id).run()

    await addEvent({ page, startsAt: 500 })
    const upcoming = await addEvent({ page, startsAt: 5000, capacity: 2 })
    const later = await addEvent({ page, startsAt: 6000, opensAt: 2000 })
    await signUpPerson(upcoming.eventId, 1)

    const result = await getPublishedPage(db, page.slug, 1000)
    expect(result.events.map(entry => entry.id)).toEqual([upcoming.eventId, later.eventId])
    expect(result.events[0]).toMatchObject({ spotsLeft: 1, state: 'open' })
    expect(result.events[1].state).toBe('not_open')
    expect(JSON.stringify(result)).not.toContain('@')
    expect(JSON.stringify(result)).not.toMatch(/"(?:name|email)"/)
  })

  it('finds a signup by its token for the cancel page', async () => {
    const { eventId, page } = await addEvent({ startsAt: 5000 })
    await signUpPerson(eventId, 1)

    expect(await getSignupByToken(db, tokenFor(1)))
      .toEqual({ title: page.title, startsAt: 5000, status: 'confirmed' })
    expect(await getSignupByToken(db, tokenFor(99))).toBeNull()
  })

  it('purges signups of events more than 7 days in the past', async () => {
    const now = 1_000_000
    const old = (await addEvent({ startsAt: now - 7 * 86400 - 1 })).eventId
    const boundary = (await addEvent({ startsAt: now - 7 * 86400 })).eventId
    const recent = (await addEvent({ startsAt: now - 100 })).eventId

    for (const eventId of [old, boundary, recent])
      await signUpPerson(eventId, eventId)

    expect(await purgeOldSignups(db, now)).toBe(1)
    expect(await statuses(old)).toEqual([])
    expect(await statuses(boundary)).toHaveLength(1)
    expect(await statuses(recent)).toHaveLength(1)
  })
})

describe('helsinki time', () => {
  it.each([
    ['2026-11-06', '16:30', 1793975400],
    ['2026-11-02', '12:00', 1793613600],
    ['2027-03-26', '12:00', 1806055200],
    ['2027-03-29', '12:00', 1806310800],
    ['2027-04-02', '16:30', 1806672600],
  ])('converts %s %s to Unix seconds', (date, time, unix) => {
    expect(helsinkiToUnix(date, time)).toBe(unix)
  })

  it('converts a Unix time back to the Helsinki wall clock', () => {
    expect(unixToHelsinki(1806310800)).toEqual({ date: '2027-03-29', time: '12:00' })
  })

  const page = { start_time: '16:30', opens_rule: 'monday 12:00', promote_rule: 'same-day 12:00' }

  it('resolves starts, opening and promotion times from the page rules', () => {
    expect(resolveEventTimes(page, '2026-11-06')).toEqual({
      startsAt: 1793975400,
      opensAt: 1793613600,
      promoteUntil: 1793959200,
    })
  })

  it('resolves the opening time across the DST change', () => {
    expect(resolveEventTimes(page, '2027-04-02').opensAt).toBe(1806310800)
  })

  it('supports days-before opening rules', () => {
    expect(resolveEventTimes({ ...page, opens_rule: 'days-before 2 18:00' }, '2026-11-06').opensAt)
      .toBe(helsinkiToUnix('2026-11-04', '18:00'))
  })

  it('throws on an unknown rule', () => {
    expect(() => resolveEventTimes({ ...page, opens_rule: 'tuesday 12:00' }, '2026-11-06')).toThrow()
  })
})

describe('verifyTurnstile', () => {
  it('returns true only when Cloudflare says success', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    })
    vi.stubGlobal('fetch', fetchMock)

    expect(await verifyTurnstile('token', '1.2.3.4', 'secret')).toBe(true)

    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify')
    expect(options.method).toBe('POST')
    expect(String(options.body)).toContain('secret=secret')
    expect(String(options.body)).toContain('response=token')
    expect(String(options.body)).toContain('remoteip=1.2.3.4')
  })

  it('returns false when Cloudflare does not confirm the token', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: false }),
    }))
    expect(await verifyTurnstile('token', '1.2.3.4', 'secret')).toBe(false)
  })

  it('fails closed on a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    expect(await verifyTurnstile('token', '1.2.3.4', 'secret')).toBe(false)
  })

  it('fails closed without a secret and never calls Cloudflare', async () => {
    delete process.env.TURNSTILE_SECRET_KEY
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    expect(await verifyTurnstile('token', '1.2.3.4')).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('event emails', () => {
  const input = {
    page: { title: 'Test Event' },
    event: {
      startsAt: 1793975400,
      promoteUntil: 1793959200,
      venue: 'Test Hall',
      details: 'Meet at the north door.',
    },
    name: 'Ada',
    token: 'a'.repeat(32),
    origin: 'https://juoksut.run',
  }
  const cancelLink = `https://juoksut.run/signup/cancel?token=${'a'.repeat(32)}`

  it.each([
    ['confirmed', confirmedEmail],
    ['waitlist', waitlistEmail],
    ['promoted', promotedEmail],
  ])('%s email names the event, its venue and the cancel link', (_, build) => {
    const { subject, text } = build(input)

    expect(subject).toContain('Test Event')
    expect(text).toContain('Test Event')
    expect(text).toContain('Friday 6 November at 16:30')
    expect(text).toContain('Test Hall')
    expect(text).toContain(cancelLink)
    expect(text).toContain('Lightspeed regards,\nJuoksut Crew')
    expect(text).not.toContain('Olympic')
  })

  it('includes the event details in the confirmed and promoted bodies', () => {
    for (const build of [confirmedEmail, promotedEmail])
      expect(build(input).text).toContain('Meet at the north door.')
  })

  it('tells a waitlisted person when promotions stop', () => {
    expect(waitlistEmail(input).text).toContain(
      'If a spot opens up before Friday 6 November at 12:00, you get it automatically and we email you.',
    )
  })

  it('uses the event\'s own venue instead of a hardcoded one', () => {
    const { text } = confirmedEmail({
      ...input,
      event: { ...input.event, venue: 'Helsinki Olympic Stadium' },
    })
    expect(text).toContain('Helsinki Olympic Stadium')
  })
})
