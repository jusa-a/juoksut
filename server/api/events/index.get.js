import { createError, defineEventHandler } from 'h3'
import { listEvents } from '../../utils/hqEvents'

export default defineEventHandler(async (event) => {
  const HQ = event.context.cloudflare?.env?.HQ
  if (!HQ)
    throw createError({ statusCode: 500, message: 'HQ not available' })

  return await listEvents(HQ, Math.floor(Date.now() / 1000))
})
