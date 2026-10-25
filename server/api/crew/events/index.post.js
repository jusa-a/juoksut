import { createError, defineEventHandler, readBody } from 'h3'
import { crewDb, requireCrew } from '../../../utils/crewAuth'
import { createEvents } from '../../../utils/events'

export default defineEventHandler(async (event) => {
  const _crew = await requireCrew(event)
  const body = await readBody(event) || {}
  const pageId = Number(body.pageId)
  if (!Number.isInteger(pageId) || pageId <= 0)
    throw createError({ statusCode: 400, message: 'Choose an event page' })

  return await createEvents(crewDb(event), pageId, body)
})
