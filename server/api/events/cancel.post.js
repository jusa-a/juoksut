import { createError, defineEventHandler, getRequestURL, readBody } from 'h3'
import { sendEmail } from '../../utils/email'
import { promotedEmail } from '../../utils/eventEmails'
import { cancelSignup, getEventDetails } from '../../utils/events'

const tokenPattern = /^[0-9a-f]{32}$/

export default defineEventHandler(async (event) => {
  const { token } = await readBody(event) || {}
  if (typeof token !== 'string' || !tokenPattern.test(token))
    throw createError({ statusCode: 400, message: 'Invalid token' })

  const D1 = event.context.cloudflare?.env?.D1
  if (!D1)
    throw createError({ statusCode: 500, message: 'D1 not available' })

  const { cancelled, promoted } = await cancelSignup(D1, token)

  if (promoted.length) {
    const details = await getEventDetails(D1, promoted[0].event_id)
    const origin = new URL(getRequestURL(event)).origin

    for (const person of details ? promoted : []) {
      try {
        await sendEmail({
          to: person.email,
          ...promotedEmail({ ...details, name: person.name, token: person.token, origin }),
        })
      }
      catch (error) {
        // The promotion already stands; a mail failure must not undo it.
        console.error('Failed to send event promotion email:', error.message)
      }
    }
  }

  // Same shape for unknown and already-cancelled tokens so the endpoint does
  // not reveal whether a token exists.
  return { cancelled }
})
