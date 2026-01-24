import { createError, defineEventHandler, getRequestURL, readBody } from 'h3'
import Stripe from 'stripe'
import { fetchProductData, transformProductData } from '../utils/productUtils'

interface CheckoutItem {
  slug: string
  size: string
  quantity: number
}

interface CheckoutRequestBody {
  items: CheckoutItem[]
}

interface CheckoutResponse {
  url: string | null
}

export default defineEventHandler(async (event): Promise<CheckoutResponse> => {
  const config = useRuntimeConfig(event)
  const stripeSecretKey = config.stripeSecretKey || process.env.STRIPE_SECRET_KEY

  if (!stripeSecretKey) {
    throw createError({ 
      statusCode: 500, 
      message: 'Stripe configuration missing' 
    })
  }

  try {
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-02-24.acacia', // Use latest API version
    })

    // Read request body
    const body = await readBody<CheckoutRequestBody>(event)

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      throw createError({ 
        statusCode: 400, 
        message: 'Invalid request: items array required' 
      })
    }

    // Get request origin (for redirect URLs)
    const origin = getRequestURL(event).origin

    // Validate items and fetch correct prices from the database
    const D1 = event.context.cloudflare?.env?.D1

    if (!D1) {
      throw createError({ 
        statusCode: 500, 
        message: 'Database not available' 
      })
    }

    const validatedItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []

    for (const item of body.items) {
      const productData = await fetchProductData(D1, item.slug)
      
      if (!productData) {
        throw createError({ 
          statusCode: 400, 
          message: `Invalid product: ${item.slug}` 
        })
      }

      const product = transformProductData(productData)

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
        // Fallback: create inline price data
        validatedItems.push({
          price_data: {
            currency: 'eur',
            unit_amount: Math.round(product.price * 100), // Convert to cents
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

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      line_items: validatedItems,
      mode: 'payment',
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel?canceled=true`,
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['FI', 'SE', 'NO', 'DK', 'EE', 'LV', 'LT'], // Adjust as needed
      },
      phone_number_collection: {
        enabled: true,
      },
      consent_collection: {
        terms_of_service: 'required',
      },
      custom_fields: [
        {
          key: 'order_note',
          label: { type: 'custom', custom: 'Order note' },
          type: 'text',
          optional: true,
        },
      ],
      expires_at: Math.floor(Date.now() / 1000) + (60 * 30), // Expires after 30 min
    })

    return { url: session.url }
  }
  catch (error) {
    console.error('Checkout error:', error)
    
    // Handle known errors
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    // Handle Stripe errors
    if (error instanceof Stripe.errors.StripeError) {
      throw createError({ 
        statusCode: 400, 
        message: error.message 
      })
    }

    throw createError({ 
      statusCode: 500, 
      message: 'Internal Server Error' 
    })
  }
})