import { defineEventHandler, getRequestURL } from 'h3'
import { crewDb, requireCrew } from '../../../utils/crewAuth'
import { sendPromotedEmails } from '../../../utils/eventEmails'
import { removeSignup } from '../../../utils/events'

export default defineEventHandler(async (event) => {
  const _crew = await requireCrew(event)
  const D1 = crewDb(event)
  const { cancelled, promoted } = await removeSignup(D1, Number(event.context.params.id))

  await sendPromotedEmails(D1, promoted, new URL(getRequestURL(event)).origin)

  return { cancelled, promoted: promoted.length }
})
