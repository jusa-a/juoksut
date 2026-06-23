// Pure, dependency-free validation of the checkout request body so it can be
// unit-tested directly. Returns { ok: true } or { ok: false, message }.
// Price is always re-read from D1 in checkout.js, so this only guards shape/abuse:
// a missing/huge items array, or a non-positive/non-integer quantity that would
// otherwise slip past the stock check. (audit L4 / roadmap R12)

export const MAX_CHECKOUT_ITEMS = 50

export function validateCheckoutItems(items) {
  if (!Array.isArray(items) || items.length === 0)
    return { ok: false, message: 'No items in cart' }

  if (items.length > MAX_CHECKOUT_ITEMS)
    return { ok: false, message: 'Too many items' }

  for (const item of items) {
    if (!item || typeof item !== 'object')
      return { ok: false, message: 'Invalid item' }

    if (typeof item.slug !== 'string' || item.slug.length === 0)
      return { ok: false, message: 'Invalid item: missing slug' }

    // size is optional, but if present it must be a string
    const hasSize = item.size !== undefined && item.size !== null
    if (hasSize && typeof item.size !== 'string')
      return { ok: false, message: `Invalid size for ${item.slug}` }

    if (!Number.isInteger(item.quantity) || item.quantity < 1)
      return { ok: false, message: `Invalid quantity for ${item.slug}` }
  }

  return { ok: true }
}
