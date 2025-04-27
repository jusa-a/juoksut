export const cdnBaseUrl = 'https://cdn.juoksut.run/products'

export async function fetchProductData(D1, slug = null) {
  const query = `
    SELECT p.id, p.slug, p.title, p.material, p.sizing, p.size_chart, p.description, p.price,
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

export function transformProductData(product) {
  return {
    ...product,
    material: JSON.parse(product.material || '[]'),
    sizing: JSON.parse(product.sizing || '[]'),
    sizeChart: JSON.parse(product.size_chart || '[]'),
    stock: JSON.parse(product.stock || '[]'), // Parse stock JSON string into an array
    price: product.price / 100, // Convert price from cents to euros
    img: `${cdnBaseUrl}/${product.slug}/1.png`, // Fetch only the first image
    description: product.description.split('\\n').map(paragraph => `<p>${paragraph}</p>`).join(''), // Wrap paragraphs in <p> tags
  }
}
