import type { D1Database, D1PreparedStatement } from '@cloudflare/workers-types'
import { createError, defineEventHandler, readRawBody } from 'h3'
import Stripe from 'stripe'

interface WebhookResponse {
  received: boolean
}

// Test with your local listener
// stripe listen --forward-to localhost:3000/api/stripe-webhook
// stripe trigger checkout.session.completed

export default defineEventHandler(async (event): Promise<WebhookResponse> => {
  const config = useRuntimeConfig(event)
  const stripeSecretKey = config.stripeSecretKey || process.env.STRIPE_SECRET_KEY
  const endpointSecret = config.stripeWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET

  if (!stripeSecretKey) {
    throw createError({
      statusCode: 500,
      message: 'Stripe configuration missing',
    })
  }

  if (!endpointSecret) {
    throw createError({
      statusCode: 500,
      message: 'Webhook secret not configured',
    })
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2025-02-24.acacia',
  })

  // Read the raw body for signature verification
  const rawBody = await readRawBody(event)

  if (!rawBody) {
    throw createError({
      statusCode: 400,
      message: 'Request body is required',
    })
  }

  const signature = event.node.req.headers['stripe-signature']

  if (!signature) {
    throw createError({
      statusCode: 400,
      message: 'Missing stripe-signature header',
    })
  }

  try {
    const stripeEvent = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      endpointSecret,
    )

    // console.log('⚡️  Webhook verified:', stripeEvent.type)

    // Handle the event
    if (stripeEvent.type === 'checkout.session.completed') {
      const session = stripeEvent.data.object as Stripe.Checkout.Session

      const D1 = event.context.cloudflare?.env?.D1 as D1Database | undefined

      if (!D1) {
        throw createError({
          statusCode: 500,
          message: 'Database not available',
        })
      }

      try {
        // Fetch line items for the session with expanded product details
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
          expand: ['data.price.product'],
        })

        // Prepare batch queries
        const queries: D1PreparedStatement[] = lineItems.data.map((item) => {
          const product = item.price?.product
          const productMeta = (typeof product === 'object' && product !== null && 'metadata' in product)
            ? product.metadata
            : {}
          const priceMeta = item.price?.metadata || {}

          const productSlug = productMeta.slug || priceMeta.slug
          let size = productMeta.size || priceMeta.size

          // Fallback: if no size provided (e.g. one-size product), assume 'ONE-SIZE'
          if (!size) {
            size = 'ONE-SIZE'
          }

          const quantity = item.quantity || 0

          if (!productSlug) {
            const productId = typeof product === 'string' ? product : product?.id
            throw new Error(`Missing slug metadata for product/price ${productId}`)
          }

          return D1.prepare(
            `UPDATE stock SET quantity = quantity - ? WHERE product_slug = ? AND size = ?`,
          ).bind(quantity, productSlug, size)
        })

        // Execute all queries in a batch
        await D1.batch(queries)

        console.warn(`✅ Stock updated for session ${session.id}`)
      }
      catch (error) {
        console.error('Failed to process checkout session:', error)
        throw createError({
          statusCode: 500,
          message: 'Failed to update stock',
        })
      }
    }

    return { received: true }
  }
  catch (error) {
    console.error('Webhook error:', error)

    // Handle known errors
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    // Handle Stripe signature verification errors
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw createError({
      statusCode: 400,
      message: `Webhook error: ${message}`,
    })
  }
})
