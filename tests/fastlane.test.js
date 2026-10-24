import { beforeEach, describe, expect, it } from 'vitest'
import {
  cancelSignup,
  FastlaneSignupError,
  helsinkiToday,
  listSessions,
  purgeOldSignups,
  signUp,
} from '../server/utils/fastlane'
import { createD1 } from './helpers/d1Shim'

let db

beforeEach(() => {
  db = createD1()
})

function tokenFor(n) {
  return n.toString(16).padStart(32, '0')
}

async function addSession({ date = '2026-11-06', capacity = 2, opensAt = 0 } = {}) {
  const { meta } = await db.prepare(
    'INSERT INTO fastlane_sessions (date, capacity, opens_at) VALUES (?, ?, ?)',
  ).bind(date, capacity, opensAt).run()
  return meta.last_row_id
}

function signUpPerson(sessionId, person, now = 1000) {
  return signUp(db, {
    sessionId,
    name: `Person ${person}`,
    email: `person${person}@example.com`,
    token: tokenFor(person),
    now,
  })
}

async function statuses(sessionId) {
  const { results } = await db.prepare(`
    SELECT email, status FROM fastlane_signups
    WHERE session_id = ?
    ORDER BY created_at, id
  `).bind(sessionId).all()
  return results.map(row => `${row.email}:${row.status}`)
}

describe('fastlane signups', () => {
  it('fills confirmed spots up to capacity, then waitlists', async () => {
    const sessionId = await addSession({ capacity: 2 })

    expect((await signUpPerson(sessionId, 1)).status).toBe('confirmed')
    expect((await signUpPerson(sessionId, 2)).status).toBe('confirmed')
    expect((await signUpPerson(sessionId, 3)).status).toBe('waitlist')

    const sessions = await listSessions(db, '2026-01-01', 1000)
    expect(sessions).toEqual([{
      id: sessionId,
      date: '2026-11-06',
      capacity: 2,
      confirmed: 2,
      waitlist: 1,
      opensAt: 0,
      state: 'full',
    }])
    // The public listing never exposes signup rows.
    expect(JSON.stringify(sessions)).not.toContain('@')
  })

  it('never exceeds capacity under 60 concurrent signups', async () => {
    const sessionId = await addSession({ capacity: 40 })

    const results = await Promise.all(
      Array.from({ length: 60 }, (_, index) => signUpPerson(sessionId, index + 1)),
    )

    expect(results.filter(result => result.status === 'confirmed')).toHaveLength(40)
    expect(results.filter(result => result.status === 'waitlist')).toHaveLength(20)

    const { results: waitlisted } = await db.prepare(`
      SELECT email FROM fastlane_signups
      WHERE session_id = ? AND status = 'waitlist'
      ORDER BY created_at, id
    `).bind(sessionId).all()

    expect(waitlisted.map(row => row.email))
      .toEqual(Array.from({ length: 20 }, (_, index) => `person${index + 41}@example.com`))
  })

  it('rejects a session that has not opened yet', async () => {
    const sessionId = await addSession({ opensAt: 2000 })

    await expect(signUpPerson(sessionId, 1, 1000)).rejects.toMatchObject({ code: 'not_open' })
    expect(await statuses(sessionId)).toEqual([])
  })

  it('rejects an unknown session', async () => {
    await expect(signUpPerson(999, 1)).rejects.toBeInstanceOf(FastlaneSignupError)
    await expect(signUpPerson(999, 1)).rejects.toMatchObject({ code: 'not_found' })
  })

  it('rejects a duplicate email', async () => {
    const sessionId = await addSession({ capacity: 5 })
    await signUpPerson(sessionId, 1)

    await expect(signUpPerson(sessionId, 1)).rejects.toMatchObject({ code: 'already_signed_up' })
  })

  it('lets a cancelled person sign up again, at the back of the waitlist', async () => {
    const sessionId = await addSession({ capacity: 1 })
    await signUpPerson(sessionId, 1)
    await signUpPerson(sessionId, 2)
    await signUpPerson(sessionId, 3)

    const cancelled = await cancelSignup(db, tokenFor(1), 2000)
    expect(cancelled.cancelled).toBe(true)
    expect(cancelled.promoted.email).toBe('person2@example.com')

    const again = await signUp(db, {
      sessionId,
      name: 'Person 1',
      email: 'person1@example.com',
      token: tokenFor(50),
      now: 3000,
    })
    expect(again.status).toBe('waitlist')
    expect(again.token).toBe(tokenFor(50))

    expect(await statuses(sessionId)).toEqual([
      'person2@example.com:confirmed',
      'person3@example.com:waitlist',
      'person1@example.com:waitlist',
    ])
  })

  it('promotes exactly the oldest waitlisted person when a confirmed spot is cancelled', async () => {
    const sessionId = await addSession({ capacity: 1 })
    await signUpPerson(sessionId, 1)
    await signUpPerson(sessionId, 2, 1000)
    await signUpPerson(sessionId, 3, 1001)

    const result = await cancelSignup(db, tokenFor(1), 2000)

    expect(result).toEqual({
      cancelled: true,
      promoted: {
        name: 'Person 2',
        email: 'person2@example.com',
        token: tokenFor(2),
        date: '2026-11-06',
      },
    })
    expect(await statuses(sessionId)).toEqual([
      'person1@example.com:cancelled',
      'person2@example.com:confirmed',
      'person3@example.com:waitlist',
    ])
  })

  it('promotes nobody when a waitlisted or unknown token is cancelled', async () => {
    const sessionId = await addSession({ capacity: 1 })
    await signUpPerson(sessionId, 1)
    await signUpPerson(sessionId, 2)

    expect(await cancelSignup(db, tokenFor(2), 2000))
      .toEqual({ cancelled: true, promoted: null })
    expect(await cancelSignup(db, tokenFor(99), 2000))
      .toEqual({ cancelled: false, promoted: null })
    expect(await statuses(sessionId)).toEqual([
      'person1@example.com:confirmed',
      'person2@example.com:cancelled',
    ])
  })

  it('lists only today or later and reports not-open sessions', async () => {
    await addSession({ date: '2026-01-01', capacity: 2 })
    const later = await addSession({ date: '2026-11-06', capacity: 2, opensAt: 2000 })

    const sessions = await listSessions(db, '2026-11-01', 1000)

    expect(sessions.map(session => session.id)).toEqual([later])
    expect(sessions[0].state).toBe('not_open')
  })

  it('purges signups from sessions more than 7 days in the past', async () => {
    const today = '2026-11-20'
    const old = await addSession({ date: '2026-11-10' })
    const boundary = await addSession({ date: '2026-11-13' })
    const recent = await addSession({ date: '2026-11-15' })

    for (const sessionId of [old, boundary, recent])
      await signUpPerson(sessionId, sessionId)

    expect(await purgeOldSignups(db, today)).toBe(1)
    expect(await statuses(old)).toEqual([])
    expect(await statuses(boundary)).toHaveLength(1)
    expect(await statuses(recent)).toHaveLength(1)
  })

  it('formats a Helsinki local day regardless of UTC offset', () => {
    expect(helsinkiToday(Date.UTC(2026, 10, 5, 23, 30) / 1000)).toBe('2026-11-06')
    expect(helsinkiToday(Date.UTC(2026, 5, 5, 22, 30) / 1000)).toBe('2026-06-06')
    expect(helsinkiToday(Date.UTC(2026, 5, 5, 20, 30) / 1000)).toBe('2026-06-05')
  })
})
