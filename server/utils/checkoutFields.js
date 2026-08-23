const MAX_STRIPE_CUSTOM_FIELDS = 3

// Converts product-defined registration fields from D1 into Stripe Checkout
// fields. These fields describe a registration (for example, a camp shirt
// size); they deliberately do not share the stock table used for inventory.
export function buildRegistrationCustomFields(items, reservedFieldCount = 0) {
  const fieldsByKey = new Map()

  for (const { product, quantity } of items) {
    const fields = product.checkoutFields || []
    if (fields.length > 0 && quantity !== 1)
      throw new Error(`${product.title} must be purchased one registration at a time`)

    for (const field of fields) {
      if (!isValidField(field))
        throw new Error(`Invalid checkout field configuration for ${product.title}`)

      const previous = fieldsByKey.get(field.key)
      if (previous && JSON.stringify(previous) !== JSON.stringify(field))
        throw new Error(`Conflicting checkout field configuration for ${field.key}`)

      fieldsByKey.set(field.key, field)
    }
  }

  const fields = [...fieldsByKey.values()]
  if (fields.length + reservedFieldCount > MAX_STRIPE_CUSTOM_FIELDS)
    throw new Error(`A checkout can contain at most ${MAX_STRIPE_CUSTOM_FIELDS - reservedFieldCount} registration fields`)

  return fields.map(field => ({
    key: field.key,
    label: { type: 'custom', custom: field.label },
    type: 'dropdown',
    dropdown: {
      options: field.options.map(value => ({ label: value, value })),
    },
  }))
}

function isValidField(field) {
  return Boolean(
    field
    && typeof field.key === 'string'
    && /^[a-z0-9_]+$/.test(field.key)
    && typeof field.label === 'string'
    && field.label.length > 0
    && Array.isArray(field.options)
    && field.options.length >= 2
    && field.options.every(option => typeof option === 'string' && option.length > 0),
  )
}
