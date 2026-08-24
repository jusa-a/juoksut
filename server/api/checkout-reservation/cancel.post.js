import process from 'node:process'
import { createError, defineEventHandler, readBody } from 'h3'
import Stripe from 'stripe'
import { releaseReservationGroup } from '../../utils/checkoutReservations'

const reservationIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  const { reservationId } = await readBody(event) || {}
  if (typeof reservationId !== 'string' || !reservationIdPattern.test(reservationId))
    throw createError({ statusCode: 400, message: 'Invalid reservation' })

  const D1 = event.context.cloudflare?.env?.D1
  if (!D1)
    throw createError({ statusCode: 500, message: 'D1 not available' })

  const reservation = await D1.prepare(`
    SELECT stripe_session_id
    FROM checkout_reservations
    WHERE group_id = ? AND status = 'active'
    LIMIT 1
  `).bind(reservationId).first()

  // A duplicate cancel, already-paid purchase, or naturally expired hold is
  // harmless. Do not reveal which state occurred to the browser.
  if (!reservation)
    return { released: false }

  if (!reservation.stripe_session_id)
    throw createError({ statusCode: 409, message: 'Checkout is still being prepared' })

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  try {
    await stripe.checkout.sessions.expire(reservation.stripe_session_id)
  }
  catch (error) {
    // A completed payment must never have its place released. The payment
    // webhook will settle it; an already-expired session is also safe to leave
    // to that webhook/fallback cleanup.
    console.error('Failed to expire cancelled Checkout Session:', error)
    return { released: false }
  }

  await releaseReservationGroup(D1, reservationId)
  return { released: true }
})
