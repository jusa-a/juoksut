import { describe, expect, it, vi } from 'vitest'
import {
  cancelSignup,
  getEventPage,
  getSignupByToken,
  listEvents,
  signUpForEvent,
} from '../server/utils/hqEvents'

const page = {
  slug: 'fastlane-friday',
  title: 'FASTLANE FRIDAY',
  body: 'Every Friday.',
  imageUrl: 'https://cdn.juoksut.run/x.jpeg',
  shareText: 'Indoor track.',
  place: 'Olympic Stadium tunnel',
  sessions: [
    { id: 's-1', startsAt: 1793977200, opensAt: 1793628000, state: 'open', spotsLeft: 3 },
    { id: 's-2', startsAt: 1794582000, opensAt: 1794232800, state: 'cancelled', spotsLeft: null },
  ],
}

const signup = {
  eventId: 's-1',
  name: 'Aino',
  email: 'aino@example.com',
  website: '',
  turnstileToken: 'tok',
}

const token = 'a'.repeat(32)

describe('getEventPage', () => {
  it('page maps sessions to events', async () => {
    const getEvent = vi.fn().mockResolvedValue({ ok: true, event: page })

    expect(await getEventPage({ getEvent }, 'fastlane-friday')).toEqual({
      slug: 'fastlane-friday',
      title: 'FASTLANE FRIDAY',
      body: 'Every Friday.',
      imageUrl: 'https://cdn.juoksut.run/x.jpeg',
      summary: 'Indoor track.',
      events: [
        { id: 's-1', startsAt: 1793977200, venue: 'Olympic Stadium tunnel', opensAt: 1793628000, state: 'open', spotsLeft: 3 },
        { id: 's-2', startsAt: 1794582000, venue: 'Olympic Stadium tunnel', opensAt: 1794232800, state: 'cancelled', spotsLeft: null },
      ],
    })
    expect(getEvent).toHaveBeenCalledWith('fastlane-friday')
  })

  it('a missing page is 404', async () => {
    const getEvent = vi.fn().mockResolvedValue({ error: 'not_found' })

    await expect(getEventPage({ getEvent }, 'nope'))
      .rejects
      .toMatchObject({ statusCode: 404, message: 'No such event page' })
  })
})

describe('signUpForEvent', () => {
  it('signup passes everything HQ needs', async () => {
    const signUp = vi.fn().mockResolvedValue({ ok: true, status: 'confirmed', position: null })

    expect(await signUpForEvent(
      { signUp },
      { ...signup, ip: '203.0.113.1', origin: 'https://juoksut.run' },
    )).toEqual({ status: 'confirmed' })

    expect(signUp).toHaveBeenCalledWith({
      sessionId: 's-1',
      name: 'Aino',
      email: 'aino@example.com',
      website: '',
      turnstileToken: 'tok',
      ip: '203.0.113.1',
      origin: 'https://juoksut.run',
    })
  })

  it('waitlist returns the position', async () => {
    const signUp = vi.fn().mockResolvedValue({ ok: true, status: 'waitlist', position: 2 })

    expect(await signUpForEvent({ signUp }, signup))
      .toEqual({ status: 'waitlist', position: 2 })
  })

  it('signup errors keep their codes', async () => {
    const cases = [
      ['invalid', 400, 'Invalid signup'],
      ['bot_check_failed', 403, 'Bot check failed'],
      ['not_found', 404, 'No such event'],
      ['not_open', 403, 'Signups are not open yet'],
      ['already_signed_up', 409, 'You are already signed up'],
      ['email_domain', 422, 'That email address can\'t receive mail'],
    ]

    for (const [error, statusCode, message] of cases) {
      const signUp = vi.fn().mockResolvedValue({ error })
      await expect(signUpForEvent({ signUp }, signup))
        .rejects
        .toMatchObject({ statusCode, message })
    }
  })

  it('a non-string eventId is refused without calling HQ', async () => {
    const signUp = vi.fn()

    await expect(signUpForEvent({ signUp }, { ...signup, eventId: 5 }))
      .rejects
      .toMatchObject({ statusCode: 400, message: 'Invalid signup' })
    expect(signUp).not.toHaveBeenCalled()
  })
})

describe('getSignupByToken', () => {
  it('signup lookup', async () => {
    const getSignup = vi.fn().mockResolvedValue({
      ok: true,
      title: 'FASTLANE FRIDAY',
      startsAt: 1793977200,
      status: 'confirmed',
      sessionCancelled: false,
    })

    expect(await getSignupByToken({ getSignup }, token)).toEqual({
      title: 'FASTLANE FRIDAY',
      startsAt: 1793977200,
      status: 'confirmed',
      sessionCancelled: false,
    })
    expect(getSignup).toHaveBeenCalledWith(token)

    expect(await getSignupByToken({ getSignup }, token)).not.toHaveProperty('ok')
  })

  it('a bad token is refused without calling HQ', async () => {
    const getSignup = vi.fn()

    await expect(getSignupByToken({ getSignup }, 'nope'))
      .rejects
      .toMatchObject({ statusCode: 400, message: 'Invalid token' })
    expect(getSignup).not.toHaveBeenCalled()
  })

  it('an unknown signup is 404', async () => {
    const getSignup = vi.fn().mockResolvedValue({ error: 'not_found' })

    await expect(getSignupByToken({ getSignup }, token))
      .rejects
      .toMatchObject({ statusCode: 404, message: 'No such signup' })
  })
})

describe('cancelSignup', () => {
  it('cancel', async () => {
    const cancel = vi.fn().mockResolvedValue({ ok: true, cancelled: true })

    expect(await cancelSignup({ cancel }, token, 'https://juoksut.run'))
      .toEqual({ cancelled: true })
    expect(cancel).toHaveBeenCalledWith({ token, origin: 'https://juoksut.run' })
  })

  it('a bad token is refused without calling HQ', async () => {
    const cancel = vi.fn()

    await expect(cancelSignup({ cancel }, 'nope', 'https://juoksut.run'))
      .rejects
      .toMatchObject({ statusCode: 400, message: 'Invalid token' })
    expect(cancel).not.toHaveBeenCalled()
  })
})

describe('listEvents', () => {
  it('list keeps the gallery\'s statuses and order', async () => {
    const now = 1793606400
    const list = vi.fn().mockResolvedValue([
      { slug: 'past', title: 'Past', shareText: 'p', imageUrl: null, firstStartsAt: 1780000000, lastStartsAt: 1780000000 },
      { slug: 'now', title: 'Now', shareText: 'n', imageUrl: null, firstStartsAt: 1793372400, lastStartsAt: 1795186800 },
      { slug: 'later', title: 'Later', shareText: 'l', imageUrl: null, firstStartsAt: 1797148800, lastStartsAt: 1797148800 },
    ])

    const { events } = await listEvents({ listEvents: list }, now)

    expect(events.map(event => event.slug)).toEqual(['now', 'later', 'past'])
    expect(events.map(event => event.status)).toEqual(['current', 'upcoming', 'past'])
    expect(events.map(event => event.summary)).toEqual(['n', 'l', 'p'])
  })
})
