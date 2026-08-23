// Resolve stock against the app's own catalogue first. Stripe metadata remains
// useful for inline price_data products, but must not override a configured
// Stripe Price -> D1 product mapping.
export function resolveStockUpdate({ catalogProduct, priceMetadata = {}, productMetadata = {}, priceId }) {
  const productSlug = catalogProduct?.slug || productMetadata.slug || priceMetadata.slug
  if (!productSlug)
    throw new Error(`Could not resolve product slug for price ${priceId}`)

  return {
    productSlug,
    size: productMetadata.size || priceMetadata.size || 'ONE-SIZE',
  }
}

// A successful SQL statement can still have changed zero rows when the
// product/size mapping is wrong or the stock row was removed. Treat that as a
// payment-processing failure so Stripe retries and the issue is visible.
export function assertStockUpdatesApplied(updates, results) {
  for (const [index, result] of results.entries()) {
    if (result.meta?.changes !== 1) {
      const update = updates[index]
      throw new Error(`Stock row was not updated for ${update.productSlug}, size ${update.size}`)
    }
  }
}
