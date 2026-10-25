import { defineEventHandler } from 'h3'
import { crewDb, requireCrew } from '../../../utils/crewAuth'
import { deleteEvent } from '../../../utils/events'

export default defineEventHandler(async (event) => {
  await requireCrew(event)
  await deleteEvent(crewDb(event), Number(event.context.params.id))
  return { deleted: true }
})
