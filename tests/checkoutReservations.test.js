import { describe, expect, it } from 'vitest'
import { CHECKOUT_RESERVATION_SECONDS, isSinglePlacePerProduct, reservationItems } from '../server/utils/checkoutReservations'

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

  it('uses Stripe Checkout\'s 30-minute minimum window', () => {
    expect(CHECKOUT_RESERVATION_SECONDS).toBe(60 * 30)
  })

  it('accepts a single limited line', () => {
    expect(isSinglePlacePerProduct([{ productSlug: 'camp', size: 'M', quantity: 1 }])).toBe(true)
  })

  it('rejects two lines of one limited product in different sizes', () => {
    expect(isSinglePlacePerProduct([
      { productSlug: 'camp', size: 'M', quantity: 1 },
      { productSlug: 'camp', size: 'L', quantity: 1 },
    ])).toBe(false)
  })

  it('rejects a limited line with more than one place', () => {
    expect(isSinglePlacePerProduct([{ productSlug: 'camp', size: 'M', quantity: 2 }])).toBe(false)
  })

  it('accepts one line each of two different limited products', () => {
    expect(isSinglePlacePerProduct([
      { productSlug: 'camp', size: 'M', quantity: 1 },
      { productSlug: 'run', size: 'M', quantity: 1 },
    ])).toBe(true)
  })
})
