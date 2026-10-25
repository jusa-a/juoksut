import { createError, defineEventHandler } from 'h3'
import { crewDb, requireCrew } from '../../../../utils/crewAuth'
import { getCrewEvent, listEventSignups } from '../../../../utils/events'

export default defineEventHandler(async (event) => {
  await requireCrew(event)
  const D1 = crewDb(event)
  const id = Number(event.context.params.id)

  const crewEvent = await getCrewEvent(D1, id)
  if (!crewEvent)
    throw createError({ statusCode: 404, message: 'No such event' })

  return { event: crewEvent, signups: await listEventSignups(D1, id) }
})
