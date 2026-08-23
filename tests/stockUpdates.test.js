import { describe, expect, it } from 'vitest'
import { assertStockUpdatesApplied, resolveStockUpdate } from '../server/utils/stockUpdates'

describe('resolveStockUpdate', () => {
  it('uses the D1 Stripe Price mapping before Stripe metadata', () => {
    expect(resolveStockUpdate({
      catalogProduct: { slug: 'all-stars-camp-2026' },
      priceId: 'price_camp',
      productMetadata: { slug: 'stale-stripe-slug' },
    })).toEqual({ productSlug: 'all-stars-camp-2026', size: 'ONE-SIZE' })
  })

  it('uses Stripe metadata for inline price_data products', () => {
    expect(resolveStockUpdate({
      priceId: 'price_inline',
      productMetadata: { slug: 'tee', size: 'M' },
    })).toEqual({ productSlug: 'tee', size: 'M' })
  })

  it('fails when neither mapping can identify the product', () => {
    expect(() => resolveStockUpdate({ priceId: 'price_unknown' })).toThrow('Could not resolve product slug')
  })
})

describe('assertStockUpdatesApplied', () => {
  const updates = [{ productSlug: 'all-stars-camp-2026', size: 'ONE-SIZE', quantity: 1 }]

  it('accepts an update that changed its stock row', () => {
    expect(() => assertStockUpdatesApplied(updates, [{ meta: { changes: 1 } }])).not.toThrow()
  })

  it('fails instead of silently accepting a missing stock row', () => {
    expect(() => assertStockUpdatesApplied(updates, [{ meta: { changes: 0 } }])).toThrow('Stock row was not updated')
  })
})
