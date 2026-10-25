import { defineEventHandler, getQuery } from 'h3'
import { crewDb, requireCrew } from '../../../utils/crewAuth'
import { listPageEvents } from '../../../utils/events'

export default defineEventHandler(async (event) => {
  const _crew = await requireCrew(event)
  const pageId = Number(getQuery(event).pageId) || null
  return { events: await listPageEvents(crewDb(event), pageId) }
})
