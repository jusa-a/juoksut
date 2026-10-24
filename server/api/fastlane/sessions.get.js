import { createError, defineEventHandler } from 'h3'
import { helsinkiToday, listSessions, purgeOldSignups } from '../../utils/fastlane'

export default defineEventHandler(async (event) => {
  const D1 = event.context.cloudflare?.env?.D1
  if (!D1)
    throw createError({ statusCode: 500, message: 'D1 not available' })

  const now = Math.floor(Date.now() / 1000)
  const today = helsinkiToday(now)
  await purgeOldSignups(D1, today)

  return listSessions(D1, today, now)
})
