import { defineEventHandler } from 'h3'
import { fetchProductData, transformProductData } from '../utils/productUtils'

export default defineEventHandler(async (event) => {
  const D1 = event.context.cloudflare?.env?.D1

  try {
    const products = await fetchProductData(D1)
    return products.map(product => transformProductData(product))
  }
  catch (error) {
    console.error('Error fetching products:', error)
    throw createError({ statusCode: 500, message: 'Failed to fetch products' })
  }
})
