import process from 'node:process'
import { createError, defineEventHandler } from 'h3'
import Stripe from 'stripe'

export default defineEventHandler(async (event) => {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

    // Fetch all products from Stripe
    const products = await stripe.products.list()

    // Map products by their metadata.slug and fetch price details using default_price
    const productMap = await Promise.all(
      products.data.map(async (product) => {
        if (product.metadata.slug && product.default_price) {
          const price = await stripe.prices.retrieve(product.default_price)
          return {
            slug: product.metadata.slug,
            data: {
              productId: product.id,
              name: product.name,
              description: product.description,
              priceId: price.id,
              price: price.unit_amount / 100, // Convert to euros
            },
          }
        }
        return null
      }),
    )

    // Filter out null entries and convert to a plain object
    const priceMap = productMap
      .filter(entry => entry !== null)
      .reduce((acc, entry) => {
        acc[entry.slug] = entry.data
        return acc
      }, {})

    // Return the plain object directly
    return priceMap
  }
  catch (error) {
    console.error('Error fetching Stripe prices:', error)
    throw createError({ statusCode: 500, message: 'Failed to fetch Stripe prices' })
  }
})
