import process from 'node:process'
import { createError, defineEventHandler, getRequestURL, readBody } from 'h3'
import Stripe from 'stripe'
import { buildRegistrationCustomFields } from '../utils/checkoutFields'
import {
  CHECKOUT_RESERVATION_SECONDS,
  releaseExpiredReservations,
  releaseReservationGroup,
  reservationItems,
  ReservationUnavailableError,
  reserveItems,
} from '../utils/checkoutReservations'
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

    // A missed expiry webhook must not keep a camp place unavailable forever.
    // This does nothing for regular merchandise, which never creates rows in
    // checkout_reservations.
    await releaseExpiredReservations(D1)

    for (const item of body.items) {
      const productData = await fetchProductData(D1, item.slug)
      if (!productData) {
        throw createError({ statusCode: 400, message: `Invalid product: ${item.slug}` })
      }

      const product = transformProductData(productData)

      registrationItems.push({ product, quantity: item.quantity, size: item.size })

      if (product.salesStartAt && Date.now() < product.salesStartAt * 1000) {
        throw createError({
          statusCode: 403,
          message: `${product.title} registration has not opened yet`,
        })
      }

      // A registration price must be configured before a limited camp can be
      // purchased. This is a final server-side safeguard against accidentally
      // opening a €0 checkout while the launch details are being prepared.
      if (product.reserveStock && product.price <= 0) {
        throw createError({
          statusCode: 400,
          message: `${product.title} price has not been set yet`,
        })
      }

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

    const reservedItems = reservationItems(registrationItems)
    if (reservedItems.some(item => item.quantity !== 1)) {
      throw createError({
        statusCode: 400,
        message: 'Limited registrations must be purchased one at a time',
      })
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

    // Reserve camp capacity before giving the browser a payment URL. Stripe's
    // client_reference_id lets the webhook find this hold without storing any
    // buyer information in D1.
    const reservationGroupId = reservedItems.length > 0 ? crypto.randomUUID() : null
    const expiresAt = Math.floor(Date.now() / 1000) + CHECKOUT_RESERVATION_SECONDS
    if (reservationGroupId) {
      try {
        await reserveItems(D1, reservationGroupId, reservedItems, expiresAt)
      }
      catch (error) {
        if (error instanceof ReservationUnavailableError) {
          throw createError({ statusCode: 400, message: error.message })
        }
        throw error
      }
    }

    let session
    try {
      // Create Stripe Checkout Session
      session = await stripe.checkout.sessions.create({
        line_items: validatedItems,
        mode: 'payment',
        // Keep customer names, emails, and collected phone numbers together in
        // Stripe's Customers view instead of showing completed payments only as
        // anonymous guest checkouts.
        customer_creation: 'always',
        success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        // The opaque reservation id lets /cancel expire this exact Stripe
        // session and release its held place immediately. It is not buyer PII.
        cancel_url: reservationGroupId
          ? `${origin}/cancel?canceled=true&reservation=${reservationGroupId}`
          : `${origin}/cancel?canceled=true`,
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
        expires_at: expiresAt,
        ...(reservationGroupId ? { client_reference_id: reservationGroupId } : {}),
      })
    }
    catch (error) {
      // Do not strand a camp place when Stripe cannot create a session.
      if (reservationGroupId) {
        try {
          await releaseReservationGroup(D1, reservationGroupId)
        }
        catch (releaseError) {
          console.error('Failed to release checkout reservation:', releaseError)
        }
      }
      throw error
    }

    if (reservationGroupId) {
      try {
        const storedSession = await D1.prepare(`
          UPDATE checkout_reservations
          SET stripe_session_id = ?
          WHERE group_id = ? AND status = 'active'
        `).bind(session.id, reservationGroupId).run()

        if (!storedSession.meta?.changes)
          throw new Error('Reservation was not active after Checkout creation')
      }
      catch (error) {
        // Do not leave a live payment URL for a reservation we cannot cancel
        // or reconcile. Expire it first, then return the held capacity.
        try {
          await stripe.checkout.sessions.expire(session.id)
        }
        catch (expireError) {
          console.error('Failed to expire Checkout Session after reservation error:', expireError)
        }
        try {
          await releaseReservationGroup(D1, reservationGroupId)
        }
        catch (releaseError) {
          console.error('Failed to release checkout reservation:', releaseError)
        }
        throw error
      }
    }

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
