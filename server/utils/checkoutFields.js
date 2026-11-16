export const MAX_STRIPE_CUSTOM_FIELDS = 3
const MAX_LABEL_LENGTH = 50
const MAX_SUBMIT_MESSAGE_LENGTH = 1200

// Converts product-defined registration fields from D1 into Stripe Checkout
// fields. These fields describe a registration (for example, a camp shirt
// size); they deliberately do not share the stock table used for inventory.
// A field is a required dropdown with `options`, or a required text field
// (`type: 'text'`); either may carry `help`, shown above the Pay button.
export function buildRegistrationCustomFields(items, reservedFieldCount = 0) {
  const fields = registrationFields(items)
  if (fields.length + reservedFieldCount > MAX_STRIPE_CUSTOM_FIELDS)
    throw new Error(`A checkout can contain at most ${MAX_STRIPE_CUSTOM_FIELDS - reservedFieldCount} registration fields`)

  return fields.map((field) => {
    const label = { type: 'custom', custom: field.label }
    if (field.type === 'text')
      return { key: field.key, label, type: 'text', optional: false }
    return {
      key: field.key,
      label,
      type: 'dropdown',
      dropdown: {
        options: field.options.map(label => ({ label, value: optionValue(label) })),
      },
    }
  })
}

// Stripe's submit text: the registration fields' help, or null when none has any.
export function registrationSubmitMessage(items) {
  return submitMessage(registrationFields(items)) || null
}

function submitMessage(fields) {
  return fields.map(field => field.help).filter(Boolean).join(' ')
}

function registrationFields(items) {
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
  if (submitMessage(fields).length > MAX_SUBMIT_MESSAGE_LENGTH)
    throw new Error(`Checkout field help is longer than ${MAX_SUBMIT_MESSAGE_LENGTH} characters`)
  return fields
}

function isValidField(field) {
  if (!field
    || typeof field.key !== 'string'
    || !/^[a-z0-9_]+$/.test(field.key)
    || typeof field.label !== 'string'
    || field.label.length === 0
    || field.label.length > MAX_LABEL_LENGTH
    || (field.help !== undefined && (typeof field.help !== 'string' || field.help.length === 0))) {
    return false
  }

  if (field.type === 'text')
    return field.options === undefined

  return Boolean(
    field.type === undefined
    && Array.isArray(field.options)
    && field.options.length >= 2
    && field.options.every(option => typeof option === 'string' && optionValue(option).length > 0)
    && new Set(field.options.map(optionValue)).size === field.options.length,
  )
}

// Stripe requires each dropdown option's value to be alphanumeric; the label
// keeps the text the buyer sees, such as "Gluten free".
function optionValue(label) {
  return label.replace(/[^a-z0-9]/gi, '')
}
