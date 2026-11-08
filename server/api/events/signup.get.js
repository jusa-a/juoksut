import { createError, defineEventHandler, getQuery, setResponseHeader } from 'h3'
import { getSignupByToken } from '../../utils/hqEvents'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')

  const HQ = event.context.cloudflare?.env?.HQ
  if (!HQ)
    throw createError({ statusCode: 500, message: 'HQ not available' })

  return await getSignupByToken(HQ, getQuery(event).token)
})
