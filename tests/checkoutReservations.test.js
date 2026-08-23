import { describe, expect, it } from 'vitest'
import { CHECKOUT_RESERVATION_SECONDS, reservationItems } from '../server/utils/checkoutReservations'

describe('checkout reservations', () => {
  it('only reserves products explicitly configured as limited registrations', () => {
    expect(reservationItems([
      { product: { slug: 'tee', reserveStock: false }, size: 'M', quantity: 1 },
      { product: { slug: 'all-stars-camp-2026', reserveStock: true }, size: 'ONE-SIZE', quantity: 1 },
    ])).toEqual([{
      productSlug: 'all-stars-camp-2026',
      size: 'ONE-SIZE',
      quantity: 1,
    }])
  })

  it('uses the same ten-minute window as Stripe Checkout', () => {
    expect(CHECKOUT_RESERVATION_SECONDS).toBe(60 * 10)
  })
})
