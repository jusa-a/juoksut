import type { D1Database } from '@cloudflare/workers-types'

// Database row types (raw from D1)
interface ProductRow {
  id: number
  slug: string
  title: string
  material: string // JSON string
  sizing: string // JSON string
  size_chart: string // JSON string
  description: string
  price: number // in cents
  stripe_product_id: string | null
  stripe_price_id: string | null
  totalStock: number
  stock: string // JSON string
}

// Stock item type
export interface StockItem {
  size: string
  quantity: number
}

// Material/Sizing items
export interface MaterialItem {
  [key: string]: any // Adjust based on your actual structure
}

export interface SizingItem {
  [key: string]: any // Adjust based on your actual structure
}

export interface SizeChartItem {
  [key: string]: any // Adjust based on your actual structure
}

// Transformed product type
export interface Product {
  id: number
  slug: string
  title: string
  material: MaterialItem[]
  sizing: SizingItem[]
  sizeChart: SizeChartItem[]
  description: string
  price: number // in euros
  stripe_product_id: string | null
  stripe_price_id: string | null
  totalStock: number
  stock: StockItem[]
  img: string
}

export const cdnBaseUrl = 'https://cdn.juoksut.run/products'

// Function overloads for better type inference
export async function fetchProductData(
  D1: D1Database,
  slug: string
): Promise<ProductRow | null>
export async function fetchProductData(
  D1: D1Database
): Promise<ProductRow[]>
export async function fetchProductData(
  D1: D1Database,
  slug?: string | null
): Promise<ProductRow | ProductRow[] | null> {
  const query = `
    SELECT p.id, p.slug, p.title, p.material, p.sizing, p.size_chart, p.description, p.price,
           p.stripe_product_id, p.stripe_price_id,
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
  return slug ? stmt.first<ProductRow>() : (await stmt.all<ProductRow>()).results
}

export function transformProductData(product: ProductRow): Product {
  return {
    ...product,
    stripe_product_id: product.stripe_product_id || null,
    stripe_price_id: product.stripe_price_id || null,
    material: JSON.parse(product.material || '[]') as MaterialItem[],
    sizing: JSON.parse(product.sizing || '[]') as SizingItem[],
    sizeChart: JSON.parse(product.size_chart || '[]') as SizeChartItem[],
    stock: JSON.parse(product.stock || '[]') as StockItem[],
    price: product.price / 100, // Convert price from cents to euros
    img: `${cdnBaseUrl}/${product.slug}/1.png`,
    description: product.description
      .split('\\n')
      .map(paragraph => `<p>${paragraph}</p>`)
      .join(''),
  }
}