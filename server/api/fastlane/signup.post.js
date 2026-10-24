import { createError, defineEventHandler, getRequestURL, readBody } from 'h3'
import { sendEmail } from '../../utils/email'
import { FastlaneSignupError, signUp } from '../../utils/fastlane'
import { confirmedEmail, waitlistEmail } from '../../utils/fastlaneEmails'

const emailPattern = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/
const errorMessages = {
  not_found: 'No such session',
  not_open: 'Signups are not open yet',
  already_signed_up: 'You are already signed up',
}

export default defineEventHandler(async (event) => {
  const { sessionId, name, email, website } = await readBody(event) || {}

  // Honeypot: a real browser never fills this hidden field. Answer like a
  // normal success so bots get no signal, but write nothing.
  if (typeof website === 'string' && website.trim()) {
    return { status: 'confirmed' }
  }

  const cleanName = typeof name === 'string' ? name.trim() : ''
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''

  if (!Number.isInteger(sessionId) || sessionId <= 0
    || cleanName.length < 1 || cleanName.length > 80
    || cleanEmail.length > 254 || !emailPattern.test(cleanEmail)) {
    throw createError({ statusCode: 400, message: 'Invalid signup' })
  }

  const D1 = event.context.cloudflare?.env?.D1
  if (!D1)
    throw createError({ statusCode: 500, message: 'D1 not available' })

  const now = Math.floor(Date.now() / 1000)
  const token = randomToken()

  let signup
  try {
    signup = await signUp(D1, { sessionId, name: cleanName, email: cleanEmail, token, now })
  }
  catch (error) {
    if (!(error instanceof FastlaneSignupError))
      throw error
    throw createError({
      statusCode: { not_found: 404, not_open: 403, already_signed_up: 409 }[error.code],
      message: errorMessages[error.code] || 'Invalid signup',
    })
  }

  const session = await D1.prepare(
    'SELECT date FROM fastlane_sessions WHERE id = ?',
  ).bind(sessionId).first()

  const origin = new URL(getRequestURL(event)).origin
  const buildEmail = signup.status === 'confirmed' ? confirmedEmail : waitlistEmail

  try {
    await sendEmail({
      to: cleanEmail,
      ...buildEmail({ name: cleanName, date: session.date, token: signup.token, origin }),
    })
  }
  catch (error) {
    // A mail failure must not lose an otherwise valid signup. Log the message
    // only: no recipient or token.
    console.error('Failed to send Fastlane signup email:', error.message)
  }

  if (signup.status === 'confirmed')
    return { status: 'confirmed' }

  const { position } = await D1.prepare(`
    SELECT COUNT(*) AS position
    FROM fastlane_signups waitlisted
    JOIN fastlane_signups me ON me.token = ?
    WHERE waitlisted.session_id = me.session_id
      AND waitlisted.status = 'waitlist'
      AND (waitlisted.created_at < me.created_at
        OR (waitlisted.created_at = me.created_at AND waitlisted.id <= me.id))
  `).bind(signup.token).first()

  return { status: 'waitlist', position }
})

function randomToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('')
}
