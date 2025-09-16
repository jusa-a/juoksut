import { createError, defineEventHandler, readRawBody } from 'h3' // Use readRawBody instead of readBody
import Stripe from 'stripe'

// Test with your local listener
// stripe listen --forward-to localhost:3000/api/stripe-webhook
// stripe trigger checkout.session.completed

export default defineEventHandler(async (event) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

  // Read the raw body for signature verification
  const rawBody = await readRawBody(event)

  if (endpointSecret) {
    const signature = event.node.req.headers['stripe-signature']
    try {
      const stripeEvent = await stripe.webhooks.constructEventAsync(rawBody, signature, endpointSecret)
      // console.log('⚡️  Webhook verified:', stripeEvent.type)

      // Handle the event
      if (stripeEvent.type === 'checkout.session.completed') {
        const session = stripeEvent.data.object
        const D1 = event.context.cloudflare?.env?.D1

        try {
          // Fetch line items for the session with expanded product details
          const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
            expand: ['data.price.product'],
          })
          

          // Prepare batch queries
          const queries = lineItems.data.map((item) => {
            const productMeta = item.price.product?.metadata || {}
            const priceMeta = item.price.metadata || {}

            const productSlug = productMeta.slug || priceMeta.slug
            let size = productMeta.size || priceMeta.size

            // Fallback: if no size provided (e.g. one-size product), assume 'ONE-SIZE'
            if (!size)
              size = 'ONE-SIZE'

            const quantity = item.quantity

            if (!productSlug) {
              throw new Error(`Missing slug metadata for product/price ${item.price.product.id}`)
            }

            return D1.prepare(
              `UPDATE stock SET quantity = quantity - ? WHERE product_slug = ? AND size = ?`,
            ).bind(quantity, productSlug, size)
          })

          // Execute all queries in a batch
          await D1.batch(queries)
        }
        catch (error) {
          console.error('Failed to process checkout session:', error)
          throw createError({ statusCode: 500, message: 'Failed to update stock' })
        }
      }

      return { received: true }
    }
    catch (error) {
      // console.log(`⚠️  Webhook signature verification failed.`, error.message)
      throw createError({ statusCode: 400, message: `Webhook error: ${error.message}` })
    }
  }
})
