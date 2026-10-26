// The public event pages read and write events and signups through Lightspeed
// HQ's PublicEvents service. HQ owns capacity, the waitlist, the mails and the
// purge; this module maps its plain answers onto the JSON the pages read.

import { createError } from 'h3'

const tokenPattern = /^[0-9a-f]{32}$/

const signupErrors = {
  invalid: [400, 'Invalid signup'],
  bot_check_failed: [403, 'Bot check failed'],
  not_found: [404, 'No such event'],
  not_open: [403, 'Signups are not open yet'],
  already_signed_up: [409, 'You are already signed up'],
}

export async function getEventPage(HQ, slug) {
  const result = await HQ.getEvent(slug)
  if (result.error)
    throw createError({ statusCode: 404, message: 'No such event page' })

  const { event } = result

  return {
    slug: event.slug,
    title: event.title,
    body: event.body,
    imageUrl: event.imageUrl,
    summary: event.shareText,
    events: event.sessions.map(({ id, startsAt, opensAt, state, spotsLeft }) => ({
      id,
      startsAt,
      venue: event.place,
      opensAt,
      state,
      spotsLeft,
    })),
  }
}

export async function signUpForEvent(HQ, { eventId, name, email, website, turnstileToken, ip, origin }) {
  if (typeof eventId !== 'string' || !eventId)
    throw createError({ statusCode: 400, message: 'Invalid signup' })

  const result = await HQ.signUp({
    sessionId: eventId,
    name,
    email,
    website,
    turnstileToken,
    ip,
    origin,
  })

  if (result.error) {
    const [statusCode, message] = signupErrors[result.error] || []
    throw createError({ statusCode, message })
  }

  return result.status === 'waitlist'
    ? { status: 'waitlist', position: result.position }
    : { status: 'confirmed' }
}

export async function getSignupByToken(HQ, token) {
  if (typeof token !== 'string' || !tokenPattern.test(token))
    throw createError({ statusCode: 400, message: 'Invalid token' })

  const result = await HQ.getSignup(token)
  if (result.error)
    throw createError({ statusCode: 404, message: 'No such signup' })

  return {
    title: result.title,
    startsAt: result.startsAt,
    status: result.status,
    sessionCancelled: result.sessionCancelled,
  }
}

export async function cancelSignup(HQ, token, origin) {
  if (typeof token !== 'string' || !tokenPattern.test(token))
    throw createError({ statusCode: 400, message: 'Invalid token' })

  const result = await HQ.cancel({ token, origin })
  if (result.error)
    throw createError({ statusCode: 400, message: 'Invalid token' })

  return { cancelled: result.cancelled }
}

export function eventStatus(firstStartsAt, lastStartsAt, now) {
  if (firstStartsAt > now)
    return 'upcoming'
  if (lastStartsAt + 86400 < now)
    return 'past'
  return 'current'
}

export async function listEvents(HQ, now) {
  const events = await HQ.listEvents()
  const order = { current: 0, upcoming: 1, past: 2 }

  return {
    events: events
      .map(event => ({
        slug: event.slug,
        title: event.title,
        summary: event.shareText,
        imageUrl: event.imageUrl,
        firstStartsAt: event.firstStartsAt,
        lastStartsAt: event.lastStartsAt,
        status: eventStatus(event.firstStartsAt, event.lastStartsAt, now),
      }))
      .sort((a, b) => order[a.status] - order[b.status]
        || (a.status === 'upcoming' ? a.firstStartsAt - b.firstStartsAt : 0)
        || (a.status === 'past' ? b.lastStartsAt - a.lastStartsAt : 0)),
  }
}
