import { createError, defineEventHandler, getRequestHeader, getRequestURL, readBody } from 'h3'
import { sendEmail } from '../../utils/email'
import { confirmedEmail, waitlistEmail } from '../../utils/eventEmails'
import { EventSignupError, getEventDetails, signUp } from '../../utils/events'
import { verifyTurnstile } from '../../utils/turnstile'

const emailPattern = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/
const errorMessages = {
  not_found: 'No such event',
  not_open: 'Signups are not open yet',
  already_signed_up: 'You are already signed up',
}

export default defineEventHandler(async (event) => {
  const { eventId, name, email, website, turnstileToken } = await readBody(event) || {}

  // Honeypot: a real browser never fills this hidden field. Answer like a
  // normal success so bots get no signal, but write nothing.
  if (typeof website === 'string' && website.trim())
    return { status: 'confirmed' }

  const cleanName = typeof name === 'string' ? name.trim() : ''
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''

  if (!Number.isInteger(eventId) || eventId <= 0
    || cleanName.length < 1 || cleanName.length > 80
    || cleanEmail.length > 254 || !emailPattern.test(cleanEmail)) {
    throw createError({ statusCode: 400, message: 'Invalid signup' })
  }

  const ip = getRequestHeader(event, 'cf-connecting-ip')
  if (!await verifyTurnstile(turnstileToken, ip))
    throw createError({ statusCode: 403, message: 'Bot check failed' })

  const D1 = event.context.cloudflare?.env?.D1
  if (!D1)
    throw createError({ statusCode: 500, message: 'D1 not available' })

  const now = Math.floor(Date.now() / 1000)
  const token = randomToken()

  let signup
  try {
    signup = await signUp(D1, { eventId, name: cleanName, email: cleanEmail, token, now })
  }
  catch (error) {
    if (!(error instanceof EventSignupError))
      throw error
    throw createError({
      statusCode: { not_found: 404, not_open: 403, already_signed_up: 409 }[error.code],
      message: errorMessages[error.code] || 'Invalid signup',
    })
  }

  const details = await getEventDetails(D1, eventId)
  const origin = new URL(getRequestURL(event)).origin
  const buildEmail = signup.status === 'confirmed' ? confirmedEmail : waitlistEmail

  try {
    await sendEmail({
      to: cleanEmail,
      ...buildEmail({ ...details, name: cleanName, token: signup.token, origin }),
    })
  }
  catch (error) {
    // A mail failure must not lose an otherwise valid signup. Log the message
    // only: no recipient or token.
    console.error('Failed to send event signup email:', error.message)
  }

  if (signup.status === 'confirmed')
    return { status: 'confirmed' }

  const { position } = await D1.prepare(`
    SELECT COUNT(*) AS position
    FROM signups waitlisted
    JOIN signups me ON me.token = ?
    WHERE waitlisted.event_id = me.event_id
      AND waitlisted.status = 'waitlist'
      AND (waitlisted.created_at < me.created_at
        OR (waitlisted.created_at = me.created_at AND waitlisted.id <= me.id))
  `).bind(signup.token).first()

  return { status: 'waitlist', position }
})

function randomToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('')
}
