import { describe, expect, it } from 'vitest'
import { validateCheckoutItems } from '../server/utils/validateCheckout'

describe('validateCheckoutItems', () => {
  it('accepts a well-formed cart', () => {
    expect(validateCheckoutItems([{ slug: 'tee', size: 'M', quantity: 1 }])).toEqual({ ok: true })
  })

  it('accepts items without a size', () => {
    expect(validateCheckoutItems([{ slug: 'one-size', quantity: 2 }]).ok).toBe(true)
  })

  it('rejects a non-array or empty cart', () => {
    expect(validateCheckoutItems(undefined).ok).toBe(false)
    expect(validateCheckoutItems([]).ok).toBe(false)
    expect(validateCheckoutItems('nope').ok).toBe(false)
  })

  it('rejects non-positive or non-integer quantities (the old stock-check bypass)', () => {
    expect(validateCheckoutItems([{ slug: 'tee', quantity: 0 }]).ok).toBe(false)
    expect(validateCheckoutItems([{ slug: 'tee', quantity: -5 }]).ok).toBe(false)
    expect(validateCheckoutItems([{ slug: 'tee', quantity: 1.5 }]).ok).toBe(false)
    expect(validateCheckoutItems([{ slug: 'tee' }]).ok).toBe(false)
  })

  it('rejects a missing or empty slug', () => {
    expect(validateCheckoutItems([{ slug: '', quantity: 1 }]).ok).toBe(false)
    expect(validateCheckoutItems([{ quantity: 1 }]).ok).toBe(false)
  })

  it('rejects a non-string size', () => {
    expect(validateCheckoutItems([{ slug: 'tee', size: 42, quantity: 1 }]).ok).toBe(false)
  })

  it('caps the number of items', () => {
    const many = Array.from({ length: 51 }, () => ({ slug: 'tee', quantity: 1 }))
    expect(validateCheckoutItems(many).ok).toBe(false)
  })
})
