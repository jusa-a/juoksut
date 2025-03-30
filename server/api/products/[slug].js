import { defineEventHandler } from 'h3'
import fetch from 'node-fetch' // Use node-fetch to validate image URLs
import Stripe from 'stripe'
import images from './[slug]/images'

export default defineEventHandler(async (event) => {
  const { slug } = event.context.params
  const D1 = event.context.cloudflare?.env?.D1
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const cdnBaseUrl = 'https://cdn.juoksut.run/products'

  try {
    const queryResult = await D1.prepare(`
      SELECT p.id, p.slug, p.title, p.material, p.sizing, p.size_chart, p.description,
             COALESCE(SUM(s.quantity), 0) AS totalStock,
             JSON_GROUP_ARRAY(
               JSON_OBJECT('size', s.size, 'quantity', s.quantity)
               ORDER BY
                 CASE s.size
                   WHEN 'XXS' THEN 1
                   WHEN 'XS' THEN 2
                   WHEN 'S' THEN 3
                   WHEN 'M' THEN 4
                   WHEN 'L' THEN 5
                   WHEN 'XL' THEN 6
                   WHEN 'XXL' THEN 7
                   ELSE 8
                 END
             ) AS stock
      FROM products p
      LEFT JOIN stock s ON p.slug = s.product_slug
      WHERE p.slug = ?
      GROUP BY p.slug
      ORDER BY p.id ASC
    `).bind(slug).first()

    if (!queryResult)
      throw createError({ statusCode: 404, message: 'Product not found' })

    const stripePrice = (await stripe.prices.list({ expand: ['data.product'], active: true }))
      .data
      .find(price => price.product.metadata.slug === slug)

    return {
      ...queryResult,
      material: JSON.parse(queryResult.material || '[]'),
      sizeChart: JSON.parse(queryResult.size_chart || '[]'),
      stock: JSON.parse(queryResult.stock || '[]'),
      price: stripePrice ? stripePrice.unit_amount / 100 : null,
      priceId: stripePrice ? stripePrice.product.default_price : null,
      img: `${cdnBaseUrl}/${slug}/1.png`, // Fetch only the first image
      description: queryResult.description.replace(/\\n/g, '<br />'),
    }
  }
  catch (error) {
    console.error(`Error fetching product with slug ${slug}:`, error)
    throw createError({ statusCode: 500, message: 'Failed to fetch product' })
  }
})
