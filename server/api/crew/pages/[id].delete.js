import { defineEventHandler } from 'h3'
import { crewDb, requireCrew } from '../../../utils/crewAuth'
import { deletePage } from '../../../utils/events'

export default defineEventHandler(async (event) => {
  const _crew = await requireCrew(event)
  await deletePage(crewDb(event), Number(event.context.params.id))
  return { deleted: true }
})
