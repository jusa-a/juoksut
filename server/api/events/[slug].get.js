import { createError, defineEventHandler } from 'h3'
import { getPublishedPage, purgeOldSignups } from '../../utils/events'

export default defineEventHandler(async (event) => {
  const D1 = event.context.cloudflare?.env?.D1
  if (!D1)
    throw createError({ statusCode: 500, message: 'D1 not available' })

  const now = Math.floor(Date.now() / 1000)
  await purgeOldSignups(D1, now)

  const page = await getPublishedPage(D1, event.context.params.slug, now)
  if (!page)
    throw createError({ statusCode: 404, message: 'No such event page' })

  return page
})
