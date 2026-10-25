import { defineEventHandler } from 'h3'
import { crewDb, requireCrew } from '../../../utils/crewAuth'
import { listCrewPages } from '../../../utils/events'

export default defineEventHandler(async (event) => {
  await requireCrew(event)
  return { pages: await listCrewPages(crewDb(event)) }
})
