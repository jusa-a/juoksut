// Signup emails are built only from the event page and its event row, so the
// same code serves every event page.

import { sendEmail } from './email'
import { getEventDetails } from './events'
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

You are on the waitlist for ${page.title} on ${when} at ${event.venue}. If a spot opens up before ${formatWhen(event.promoteUntil)}, you get it automatically and we email you.

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

// Crew actions that free or add places tell the promoted people. A mail
// failure is logged and never undoes the promotion.
export async function sendPromotedEmails(D1, promoted, origin) {
  if (!promoted.length)
    return
  const details = await getEventDetails(D1, promoted[0].event_id)
  if (!details)
    return

  for (const person of promoted) {
    try {
      await sendEmail({
        to: person.email,
        ...promotedEmail({ ...details, name: person.name, token: person.token, origin }),
      })
    }
    catch (error) {
      console.error('Failed to send event promotion email:', error.message)
    }
  }
}
