import process from 'node:process'
import { createError, defineEventHandler, getQuery } from 'h3'
import Stripe from 'stripe'

export default defineEventHandler(async (event) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY) // Use Stripe secret key
  const { session_id } = getQuery(event)

  if (!session_id) {
    throw createError({ statusCode: 400, message: 'Missing session_id' })
  }

  try {
    // Fetch the session details from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['line_items.data.price.product'],
    })

    return {
      id: session.id,
      amount_total: session.amount_total,
      currency: session.currency,
      payment_status: session.payment_status,
      // Only the fields the success page renders — avoid echoing the full
      // customer_details (phone, billing address, tax ids). (audit L1 / roadmap R10)
      customer_details: session.customer_details
        ? { name: session.customer_details.name, email: session.customer_details.email }
        : null,
      line_items: session.line_items.data.map(item => ({
        description: item.description,
        quantity: item.quantity,
        amount_total: item.amount_total,
      })),
    }
  }
  catch (error) {
    console.error('Error fetching order details:', error)
    throw createError({ statusCode: 500, message: 'Failed to fetch order details' })
  }
})
