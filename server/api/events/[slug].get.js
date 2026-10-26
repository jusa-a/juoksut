import process from 'node:process'
import { createError, defineEventHandler } from 'h3'
import { getEventPage } from '../../utils/hqEvents'

export default defineEventHandler(async (event) => {
  const HQ = event.context.cloudflare?.env?.HQ
  if (!HQ)
    throw createError({ statusCode: 500, message: 'HQ not available' })

  return {
    ...await getEventPage(HQ, event.context.params.slug),
    turnstileSiteKey: process.env.TURNSTILE_SITE_KEY || null,
  }
})
