import { defineEventHandler } from 'h3'
import Stripe from 'stripe'

export default defineEventHandler(async (event) => {
  const D1 = event.context.cloudflare?.env?.D1
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const cdnBaseUrl = 'https://cdn.juoksut.run/products'

  try {
    // Fetch all products from D1
    const stmt = await D1.prepare(`
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
      GROUP BY p.slug
      ORDER BY p.id ASC
    `)

    const { results: products } = await stmt.all()

    // Fetch price data from Stripe
    const stripePrices = await stripe.prices.list({ expand: ['data.product'], active: true })
    const priceMap = stripePrices.data.reduce((acc, price) => {
      const slug = price.product.metadata.slug
      if (slug) {
        acc[slug] = {
          priceId: price.product.default_price,
          price: price.unit_amount / 100, // Convert to euros
        }
      }
      return acc
    }, {})

    // Construct image URLs based on the slug and naming convention
    const mergedProducts = products.map(product => ({
      ...product,
      material: JSON.parse(product.material || '[]'),
      sizeChart: JSON.parse(product.size_chart || '[]'),
      stock: JSON.parse(product.stock || '[]'), // Parse stock JSON
      price: priceMap[product.slug]?.price || null,
      priceId: priceMap[product.slug]?.priceId || null,
      img: `${cdnBaseUrl}/${product.slug}/1.png`, // Fetch only the first image
      description: product.description.replace(/\\n/g, '<br />'), // Replace literal \n with <br>
    }))

    return mergedProducts
  }
  catch (error) {
    console.error('Error fetching products:', error)
    throw createError({ statusCode: 500, message: 'Failed to fetch products' })
  }
})
