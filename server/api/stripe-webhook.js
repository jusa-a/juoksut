import process from 'node:process'
import { createError, defineEventHandler, readRawBody } from 'h3' // Use readRawBody instead of readBody
import Stripe from 'stripe'

// Test with your local listener
// stripe listen --forward-to localhost:3000/api/stripe-webhook
// stripe trigger checkout.session.completed

export default defineEventHandler(async (event) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

  // Fail loud if the signing secret is missing. Previously the whole handler was
  // wrapped in `if (endpointSecret)` with no else, so a missing secret silently
  // returned 200 and stock was never decremented. (audit M1 / roadmap R3)
  if (!endpointSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set — refusing to process webhook')
    throw createError({ statusCode: 500, message: 'Webhook secret not configured' })
  }

  // Read the raw body for signature verification, then verify.
  const rawBody = await readRawBody(event)
  const signature = event.node.req.headers['stripe-signature']

  let stripeEvent
  try {
    stripeEvent = await stripe.webhooks.constructEventAsync(rawBody, signature, endpointSecret)
  }
  catch (error) {
    // 400 = Stripe should not treat an unverifiable event as accepted
    throw createError({ statusCode: 400, message: `Webhook error: ${error.message}` })
  }

  // Only checkout completions mutate stock; ack everything else.
  if (stripeEvent.type !== 'checkout.session.completed')
    return { received: true }

  const session = stripeEvent.data.object
  const D1 = event.context.cloudflare?.env?.D1
  if (!D1)
    throw createError({ statusCode: 500, message: 'D1 not available' })

  // Idempotency claim: Stripe delivers at-least-once and retries on non-2xx.
  // INSERT OR IGNORE returns changes=0 when this event id was already processed,
  // so duplicate/retried deliveries are skipped instead of double-decrementing.
  // (audit H1 / roadmap R1)
  const claim = await D1.prepare(
    `INSERT OR IGNORE INTO processed_events (id, type, created_at) VALUES (?, ?, datetime('now'))`,
  ).bind(stripeEvent.id, stripeEvent.type).run()
  if (claim.meta?.changes === 0)
    return { received: true, duplicate: true }

  try {
    // Fetch line items for the session with expanded product details
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
      expand: ['data.price.product'],
    })

    // Resolve (slug, size) for every line item, then decrement stock atomically.
    const queries = await Promise.all(lineItems.data.map(async (item) => {
      const productMeta = item.price.product?.metadata || {}
      const priceMeta = item.price.metadata || {}

      let productSlug = productMeta.slug || priceMeta.slug

      // Pre-created Stripe Price line items carry no metadata from checkout, so
      // recover the slug from D1 by the price id (D1 is the source of truth).
      // Removes the dependency on Stripe-dashboard metadata. (audit H2 / roadmap R2)
      if (!productSlug && item.price?.id) {
        const row = await D1.prepare(
          `SELECT slug FROM products WHERE stripe_price_id = ?`,
        ).bind(item.price.id).first()
        productSlug = row?.slug
      }

      // Fallback: if no size provided (e.g. one-size product), assume 'ONE-SIZE'
      const size = productMeta.size || priceMeta.size || 'ONE-SIZE'
      const quantity = item.quantity

      if (!productSlug)
        throw new Error(`Could not resolve product slug for price ${item.price?.id}`)

      return D1.prepare(
        `UPDATE stock SET quantity = quantity - ? WHERE product_slug = ? AND size = ?`,
      ).bind(quantity, productSlug, size)
    }))

    // Execute all decrements in a single atomic batch
    await D1.batch(queries)
  }
  catch (error) {
    // Processing failed — release the idempotency claim so Stripe's retry re-processes.
    await D1.prepare(`DELETE FROM processed_events WHERE id = ?`).bind(stripeEvent.id).run()
    console.error('Failed to process checkout session:', error)
    throw createError({ statusCode: 500, message: 'Failed to update stock' })
  }

  return { received: true }
})
