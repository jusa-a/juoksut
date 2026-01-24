import { createError, defineEventHandler, getQuery } from 'h3'
import Stripe from 'stripe'

interface LineItemResponse {
  description: string | null
  quantity: number | null
  amount_total: number | null
}

interface OrderDetailsResponse {
  id: string
  amount_total: number | null
  currency: string | null
  customer_details: Stripe.Checkout.Session.CustomerDetails | null
  line_items: LineItemResponse[]
}

export default defineEventHandler(async (event): Promise<OrderDetailsResponse> => {
  const config = useRuntimeConfig(event)
  const stripeSecretKey = config.stripeSecretKey || process.env.STRIPE_SECRET_KEY

  if (!stripeSecretKey) {
    throw createError({
      statusCode: 500,
      message: 'Stripe configuration missing',
    })
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2025-02-24.acacia',
  })

  const query = getQuery(event)
  const session_id = query.session_id

  if (!session_id || typeof session_id !== 'string') {
    throw createError({
      statusCode: 400,
      message: 'Missing or invalid session_id',
    })
  }

  try {
    // Fetch the session details from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['line_items.data.price.product'],
    })

    if (!session.line_items) {
      throw createError({
        statusCode: 500,
        message: 'Line items not available',
      })
    }

    return {
      id: session.id,
      amount_total: session.amount_total,
      currency: session.currency,
      customer_details: session.customer_details,
      line_items: session.line_items.data.map(item => ({
        description: item.description,
        quantity: item.quantity,
        amount_total: item.amount_total,
      })),
    }
  }
  catch (error) {
    console.error('Error fetching order details:', error)

    // Handle Stripe errors
    if (error instanceof Stripe.errors.StripeError) {
      throw createError({
        statusCode: error.statusCode || 400,
        message: error.message,
      })
    }

    throw createError({
      statusCode: 500,
      message: 'Failed to fetch order details',
    })
  }
})
