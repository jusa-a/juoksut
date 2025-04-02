import { defineEventHandler } from 'h3'
import { fetchProductData, fetchStripePrices, transformProductData } from '../utils/productUtils'

export default defineEventHandler(async (event) => {
  const D1 = event.context.cloudflare?.env?.D1

  try {
    const products = await fetchProductData(D1)
    const priceMap = await fetchStripePrices()
    return products.map(product => transformProductData(product, priceMap))
  }
  catch (error) {
    console.error('Error fetching products:', error)
    throw createError({ statusCode: 500, message: 'Failed to fetch products' })
  }
})
