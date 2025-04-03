import process from 'node:process'
import { createError, defineEventHandler, getRequestURL, readBody } from 'h3'
import Stripe from 'stripe'
import { fetchProductData, transformProductData } from '../utils/productUtils'

export default defineEventHandler(async (event) => {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY) // Use Stripe secret key

    // Read request body
    const body = await readBody(event)

    // Get request origin (for redirect URLs)
    const origin = getRequestURL(event).origin

    // Validate items and fetch correct prices from the database
    const D1 = event.context.cloudflare?.env?.D1
    const validatedItems = []

    for (const item of body.items) {
      const productData = await fetchProductData(D1, item.slug)
      if (!productData) {
        throw createError({ statusCode: 400, message: `Invalid product: ${item.slug}` })
      }

      const product = transformProductData(productData) // Ensure stock is parsed into an array

      // Check stock for the requested size
      const stock = product.stock.find(stockItem => stockItem.size === item.size)
      if (!stock || stock.quantity < item.quantity) {
        throw createError({
          statusCode: 400,
          message: `Insufficient stock for ${product.title}, Size ${item.size}`,
        })
      }

      validatedItems.push({
        price_data: {
          currency: 'eur',
          unit_amount: product.price * 100, // Convert to cents
          product_data: {
            name: `${product.title}, ${item.size}`,
            images: [product.img],
            metadata: {
              slug: product.slug,
              size: item.size,
            },
          },
        },
        quantity: item.quantity,
      })
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      line_items: validatedItems,
      mode: 'payment',
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel?canceled=true`,
    })

    return { url: session.url } // Return the URL to the client
  }
  catch (error) {
    console.error(error)
    throw createError({ statusCode: error.statusCode || 500, message: error.message || 'Internal Server Error' })
  }
})
