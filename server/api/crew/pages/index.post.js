import { defineEventHandler, readBody } from 'h3'
import { crewDb, requireCrew } from '../../../utils/crewAuth'
import { savePage } from '../../../utils/events'

export default defineEventHandler(async (event) => {
  const _crew = await requireCrew(event)
  return await savePage(crewDb(event), await readBody(event) || {})
})
