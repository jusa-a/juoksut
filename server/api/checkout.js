import process from 'node:process'
import { createError, defineEventHandler, getRequestURL, readBody } from 'h3'
import Stripe from 'stripe'
import { buildRegistrationCustomFields } from '../utils/checkoutFields'
import { fetchProductData, transformProductData } from '../utils/productUtils'
import { validateCheckoutItems } from '../utils/validateCheckout'

export default defineEventHandler(async (event) => {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY) // Use Stripe secret key

    // Read request body
    const body = await readBody(event)

    // Validate the request shape before touching D1/Stripe (audit L4 / roadmap R12)
    const validation = validateCheckoutItems(body?.items)
    if (!validation.ok)
      throw createError({ statusCode: 400, message: validation.message })

    // Get request origin (for redirect URLs)
    const origin = getRequestURL(event).origin

    // Validate items and fetch correct prices from the database
    const D1 = event.context.cloudflare?.env?.D1
    const validatedItems = []
    const registrationItems = []

    for (const item of body.items) {
      const productData = await fetchProductData(D1, item.slug)
      if (!productData) {
        throw createError({ statusCode: 400, message: `Invalid product: ${item.slug}` })
      }

      const product = transformProductData(productData)

      registrationItems.push({ product, quantity: item.quantity })

      // Check stock for the requested size
      const stock = product.stock.find(stockItem => stockItem.size === item.size)
      if (!stock || stock.quantity < item.quantity) {
        throw createError({
          statusCode: 400,
          message: `Insufficient stock for ${product.title}, Size ${item.size}`,
        })
      }

      if (product.stripe_price_id) {
        // Use pre-created Stripe Price
        validatedItems.push({
          price: product.stripe_price_id,
          quantity: item.quantity,
        })
      }
      else {
        // Fallback: create inline price data (current behavior)
        validatedItems.push({
          price_data: {
            currency: 'eur',
            unit_amount: product.price * 100, // Convert to cents
            product_data: {
              name: `${product.title}${item.size ? `, ${item.size}` : ''}`,
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
    }

    let registrationCustomFields
    try {
      // One optional note remains available for general order information.
      // Product-defined fields (such as a camp shirt size) are required
      // dropdowns in Stripe Checkout instead of free-text notes.
      registrationCustomFields = buildRegistrationCustomFields(registrationItems, 1)
    }
    catch (error) {
      throw createError({ statusCode: 400, message: error.message })
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      line_items: validatedItems,
      mode: 'payment',
      // Keep customer names, emails, and collected phone numbers together in
      // Stripe's Customers view instead of showing completed payments only as
      // anonymous guest checkouts.
      customer_creation: 'always',
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel?canceled=true`,
      name_collection: {
        individual: {
          enabled: true,
        },
      },
      phone_number_collection: {
        enabled: true,
      },
      consent_collection: {
        terms_of_service: 'required',
      },
      custom_fields: [
        ...registrationCustomFields,
        {
          key: 'order_note',
          label: { type: 'custom', custom: 'Order note' },
          type: 'text',
          optional: true,
        },
      ],
      expires_at: Math.floor(Date.now() / 1000) + (60 * 30), // Expires after 30 min
    })

    return { url: session.url } // Return the URL to the client
  }
  catch (error) {
    // Preserve intentional client errors (validation / stock / invalid-product 400s);
    // never leak an unexpected internal error message to the client. (audit L5 / roadmap R13)
    if (error.statusCode)
      throw error
    console.error(error)
    throw createError({ statusCode: 500, message: 'Internal Server Error' })
  }
})
