import { createError, defineEventHandler, getRequestHeader, getRequestURL, readBody } from 'h3'
import { signUpForEvent } from '../../utils/hqEvents'

export default defineEventHandler(async (event) => {
  const { eventId, name, email, website, turnstileToken } = await readBody(event) || {}

  const HQ = event.context.cloudflare?.env?.HQ
  if (!HQ)
    throw createError({ statusCode: 500, message: 'HQ not available' })

  return await signUpForEvent(HQ, {
    eventId,
    name,
    email,
    website,
    turnstileToken,
    ip: getRequestHeader(event, 'cf-connecting-ip'),
    origin: new URL(getRequestURL(event)).origin,
  })
})
