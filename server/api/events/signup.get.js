import { createError, defineEventHandler, getQuery } from 'h3'
import { getSignupByToken } from '../../utils/hqEvents'

export default defineEventHandler(async (event) => {
  const HQ = event.context.cloudflare?.env?.HQ
  if (!HQ)
    throw createError({ statusCode: 500, message: 'HQ not available' })

  return await getSignupByToken(HQ, getQuery(event).token)
})
