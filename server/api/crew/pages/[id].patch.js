import { defineEventHandler, readBody } from 'h3'
import { crewDb, requireCrew } from '../../../utils/crewAuth'
import { savePage } from '../../../utils/events'

export default defineEventHandler(async (event) => {
  await requireCrew(event)
  const id = Number(event.context.params.id)
  return await savePage(crewDb(event), await readBody(event) || {}, id)
})
