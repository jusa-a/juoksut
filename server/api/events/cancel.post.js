import { createError, defineEventHandler, getRequestURL, readBody } from 'h3'
import { cancelSignup } from '../../utils/hqEvents'

export default defineEventHandler(async (event) => {
  const { token } = await readBody(event) || {}

  const HQ = event.context.cloudflare?.env?.HQ
  if (!HQ)
    throw createError({ statusCode: 500, message: 'HQ not available' })

  return await cancelSignup(HQ, token, new URL(getRequestURL(event)).origin)
})
