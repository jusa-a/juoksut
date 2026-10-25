import { createError, defineEventHandler, getQuery } from 'h3'
import { getSignupByToken } from '../../utils/events'

const tokenPattern = /^[0-9a-f]{32}$/

export default defineEventHandler(async (event) => {
  const { token } = getQuery(event)
  if (typeof token !== 'string' || !tokenPattern.test(token))
    throw createError({ statusCode: 400, message: 'Invalid token' })

  const D1 = event.context.cloudflare?.env?.D1
  if (!D1)
    throw createError({ statusCode: 500, message: 'D1 not available' })

  const signup = await getSignupByToken(D1, token)
  if (!signup)
    throw createError({ statusCode: 404, message: 'No such signup' })

  return signup
})
