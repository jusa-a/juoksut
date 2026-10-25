import { beforeEach, describe, expect, it } from 'vitest'
import {
  createEvents,
  deleteEvent,
  deletePage,
  listEventSignups,
  listPageEvents,
  removeSignup,
  savePage,
  signUp,
  updateEvent,
} from '../server/utils/events'
import { createD1 } from './helpers/d1Shim'

let db

beforeEach(() => {
  db = createD1()
})

function tokenFor(n) {
  return n.toString(16).padStart(32, '0')
}

function makePage(overrides = {}) {
  return savePage(db, {
    slug: 'fastlane-friday',
    title: 'Fastlane Friday',
    body: 'Body',
    summary: 'Summary',
    imageUrl: '',
    venue: 'Test Hall',
    details: 'Meet at the north door.',
    capacity: 40,
    startTime: '16:30',
    opensRule: 'monday 12:00',
    promoteRule: 'same-day 12:00',
    published: true,
    ...overrides,
  })
}

async function eventRows(pageId) {
  const { results } = await db.prepare(
    'SELECT starts_at, opens_at, promote_until, capacity FROM events WHERE page_id = ? ORDER BY starts_at',
  ).bind(pageId).all()
  return results
}

function signUpPeople(eventId, people, now) {
  return Promise.all(Array.from({ length: people }, (_, index) => signUp(db, {
    eventId,
    name: `Person ${index + 1}`,
    email: `person${index + 1}@example.com`,
    token: tokenFor(index + 1),
    now,
  })))
}

describe('crew event pages', () => {
  it('creates a weekly run and skips dates that already exist', async () => {
    const page = await makePage()

    const first = await createEvents(db, page.id, {
      firstDate: '2026-11-06',
      lastDate: '2026-11-27',
      skipDates: ['2026-11-20'],
    })
    expect(first).toEqual({ created: ['2026-11-06', '2026-11-13', '2026-11-27'], existing: [] })

    const rows = await eventRows(page.id)
    expect(rows).toHaveLength(3)
    expect(rows[0]).toEqual({
      starts_at: 1793975400,
      opens_at: 1793613600,
      promote_until: 1793959200,
      capacity: 40,
    })

    const again = await createEvents(db, page.id, {
      firstDate: '2026-11-06',
      lastDate: '2026-11-27',
      skipDates: ['2026-11-20'],
    })
    expect(again).toEqual({
      created: [],
      existing: ['2026-11-06', '2026-11-13', '2026-11-27'],
    })
    expect(await eventRows(page.id)).toHaveLength(3)
  })

  it('rejects an invalid slug or an image outside the CDN with a 400', async () => {
    await expect(makePage({ slug: 'Fastlane Friday' })).rejects.toMatchObject({ statusCode: 400 })
    await expect(makePage({ imageUrl: 'https://evil.example/x.jpg' })).rejects.toMatchObject({ statusCode: 400 })
  })

  it('refuses to lower capacity below confirmed and promotes the waitlist on a raise', async () => {
    const page = await makePage()
    await createEvents(db, page.id, { date: '2026-11-06', capacity: 2 })

    const [event] = await listPageEvents(db, page.id)
    const now = 1793959000

    await signUpPeople(event.id, 4, now)
    expect(await listEventSignups(db, event.id)).toMatchObject([
      { email: 'person1@example.com', status: 'confirmed' },
      { email: 'person2@example.com', status: 'confirmed' },
      { email: 'person3@example.com', status: 'waitlist' },
      { email: 'person4@example.com', status: 'waitlist' },
    ])

    const denied = await updateEvent(db, event.id, { capacity: 1 }, now).catch(error => error)
    expect(denied.statusCode).toBe(409)

    const raised = await updateEvent(db, event.id, { capacity: 3 }, now)
    expect(raised.promoted.map(row => row.email)).toEqual(['person3@example.com'])
    expect(raised.event).toMatchObject({ capacity: 3, confirmed: 3, waitlist: 1 })
  })

  it('removing a confirmed signup promotes the oldest waitlisted person', async () => {
    const page = await makePage()
    await createEvents(db, page.id, { date: '2026-11-06', capacity: 2 })

    const [event] = await listPageEvents(db, page.id)
    const now = 1793959000
    await signUpPeople(event.id, 4, now)

    const [first] = await listEventSignups(db, event.id)
    const result = await removeSignup(db, first.id, now)

    expect(result.cancelled).toBe(true)
    expect(result.promoted.map(row => row.email)).toEqual(['person3@example.com'])
    expect((await listEventSignups(db, event.id)).map(row => row.email))
      .toEqual(['person2@example.com', 'person3@example.com', 'person4@example.com'])
  })

  it('refuses to delete an event with signups and a page with events', async () => {
    const page = await makePage()
    await createEvents(db, page.id, { date: '2026-11-06', capacity: 1 })

    const [event] = await listPageEvents(db, page.id)
    await signUpPeople(event.id, 2, 1793959000)

    await expect(deleteEvent(db, event.id)).rejects.toMatchObject({ statusCode: 409 })
    await expect(deletePage(db, page.id)).rejects.toMatchObject({ statusCode: 409 })
  })

  it('edits an event and keeps the promotion deadline before the start', async () => {
    const page = await makePage()
    await createEvents(db, page.id, { date: '2026-11-06' })

    const [event] = await listPageEvents(db, page.id)
    const updated = await updateEvent(db, event.id, {
      venue: 'New Hall',
      details: 'New details',
      startsAtDate: '2026-11-07',
      startsAtTime: '17:00',
      opensAtDate: '2026-11-02',
      opensAtTime: '12:00',
      promoteUntilDate: '2026-11-07',
      promoteUntilTime: '12:00',
    })

    expect(updated.event).toMatchObject({
      venue: 'New Hall',
      details: 'New details',
      startsAt: 1794063600,
      opensAt: 1793613600,
      promoteUntil: 1794045600,
    })

    await expect(updateEvent(db, event.id, {
      promoteUntilDate: '2026-11-07',
      promoteUntilTime: '18:00',
    })).rejects.toMatchObject({ statusCode: 400 })
  })
})
