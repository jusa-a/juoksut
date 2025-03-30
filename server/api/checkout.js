import process from 'node:process'
import { createError, defineEventHandler, getRequestURL, readBody } from 'h3'
import Stripe from 'stripe'

export default defineEventHandler(async (event) => {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY) // Use Stripe secret key

    // Read request body
    const body = await readBody(event)

    // Get request origin (for redirect URLs)
    const origin = getRequestURL(event).origin

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      line_items: body.items.map(item => ({
        price: item.priceId, // Stripe Price ID
        quantity: item.quantity,
      })),
      mode: 'payment',
      metadata: {
        items: JSON.stringify(body.items.map(item => ({
          slug: item.slug,
          size: item.size,
          quantity: item.quantity,
        }))), // Store size and other details in metadata
      },
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel?canceled=true`,
    })

    return { url: session.url } // Return the URL to the client
  }
  catch (error) {
    console.error(error)
    throw createError({ statusCode: 500, message: 'Stripe checkout error' })
  }
})
