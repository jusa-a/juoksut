import { defineEventHandler, getRequestURL, readBody } from 'h3'
import { crewDb, requireCrew } from '../../../utils/crewAuth'
import { sendPromotedEmails } from '../../../utils/eventEmails'
import { updateEvent } from '../../../utils/events'

export default defineEventHandler(async (event) => {
  await requireCrew(event)
  const D1 = crewDb(event)
  const { event: updated, promoted } = await updateEvent(
    D1,
    Number(event.context.params.id),
    await readBody(event) || {},
  )

  await sendPromotedEmails(D1, promoted, new URL(getRequestURL(event)).origin)

  return { event: updated, promoted: promoted.length }
})
