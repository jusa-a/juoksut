import { defineEventHandler, createError } from 'h3'
import { fetchProductData, transformProductData } from '../utils/productUtils'
import type { Product } from '../utils/productUtils'

export default defineEventHandler(async (event): Promise<Product[]> => {
  const D1 = event.context.cloudflare?.env?.D1

  if (!D1) {
    throw createError({ 
      statusCode: 500, 
      message: 'Database not available' 
    })
  }

  try {
    const products = await fetchProductData(D1)
    
    if (!products || !Array.isArray(products)) {
      throw createError({ 
        statusCode: 500, 
        message: 'Invalid product data received' 
      })
    }

    return products.map(product => transformProductData(product))
  }
  catch (error) {
    console.error('Error fetching products:', error)
    throw createError({ 
      statusCode: 500, 
      message: 'Failed to fetch products' 
    })
  }
})