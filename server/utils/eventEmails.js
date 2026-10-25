// Signup emails are built only from the event page and its event row, so the
// same code serves every event page.

import { unixToHelsinki } from './helsinkiTime'

function formatWhen(startsAt) {
  const day = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Helsinki',
  }).format(new Date(startsAt * 1000))
  return `${day} at ${unixToHelsinki(startsAt).time}`
}

function cancelLink(origin, token) {
  return `${origin}/signup/cancel?token=${token}`
}

function signOff() {
  return `Lightspeed regards,
Juoksut Crew`
}

export function confirmedEmail({ page, event, name, token, origin }) {
  const when = formatWhen(event.startsAt)
  return {
    subject: `${page.title}: you are confirmed for ${when}`,
    text: `Hi ${name},

You are confirmed for ${page.title} on ${when} at ${event.venue}.

${event.details}

Can't make it? Cancel here so someone on the waitlist gets your spot: ${cancelLink(origin, token)}.

${signOff()}`,
  }
}

export function waitlistEmail({ page, event, name, token, origin }) {
  const when = formatWhen(event.startsAt)
  return {
    subject: `${page.title}: you are on the waitlist for ${when}`,
    text: `Hi ${name},

You are on the waitlist for ${page.title} on ${when} at ${event.venue}. We email you immediately if a spot opens up.

Changed your mind? Cancel here: ${cancelLink(origin, token)}.

${signOff()}`,
  }
}

export function promotedEmail({ page, event, name, token, origin }) {
  const when = formatWhen(event.startsAt)
  return {
    subject: `${page.title}: a spot opened for ${when}`,
    text: `Hi ${name},

A spot opened up, so you are now confirmed for ${page.title} on ${when} at ${event.venue}.

${event.details}

Can't make it? Cancel here so someone on the waitlist gets your spot: ${cancelLink(origin, token)}.

${signOff()}`,
  }
}
