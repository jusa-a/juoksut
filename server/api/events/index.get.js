import { createError, defineEventHandler } from 'h3'
import { listPublishedEvents } from '../../utils/events'

export default defineEventHandler(async (event) => {
  const D1 = event.context.cloudflare?.env?.D1
  if (!D1)
    throw createError({ statusCode: 500, message: 'D1 not available' })

  return { events: await listPublishedEvents(D1, Math.floor(Date.now() / 1000)) }
})
