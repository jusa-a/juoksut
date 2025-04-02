import Stripe from 'stripe'

export const cdnBaseUrl = 'https://cdn.juoksut.run/products'

export async function fetchProductData(D1, slug = null) {
  const query = `
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
    ${slug ? 'WHERE p.slug = ?' : ''}
    GROUP BY p.slug
    ORDER BY p.id ASC
  `
  const stmt = slug ? D1.prepare(query).bind(slug) : D1.prepare(query)
  return slug ? stmt.first() : (await stmt.all()).results
}

export async function fetchStripePrices() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const stripePrices = await stripe.prices.list({ expand: ['data.product'], active: true })
  return stripePrices.data.reduce((acc, price) => {
    const slug = price.product.metadata.slug
    if (slug) {
      acc[slug] = {
        priceId: price.product.default_price,
        price: price.unit_amount / 100, // Convert to euros
      }
    }
    return acc
  }, {})
}

export function transformProductData(product, priceMap) {
  return {
    ...product,
    material: JSON.parse(product.material || '[]'),
    sizeChart: JSON.parse(product.size_chart || '[]'),
    stock: JSON.parse(product.stock || '[]'),
    price: priceMap[product.slug]?.price || null,
    priceId: priceMap[product.slug]?.priceId || null,
    img: `${cdnBaseUrl}/${product.slug}/1.png`, // Fetch only the first image
    description: product.description.split('\\n').map(paragraph => `<p>${paragraph}</p>`).join(''), // Wrap paragraphs in <p> tags
  }
}
