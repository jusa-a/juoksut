import type { Product } from '../../utils/productUtils'
import { createError, defineEventHandler } from 'h3'
import { fetchProductData, transformProductData } from '../../utils/productUtils'

export default defineEventHandler(async (event): Promise<Product> => {
  const { slug } = event.context.params as { slug: string }
  const D1 = event.context.cloudflare?.env?.D1

  if (!D1) {
    throw createError({
      statusCode: 500,
      message: 'Database not available',
    })
  }

  try {
    const queryResult = await fetchProductData(D1, slug)

    if (!queryResult) {
      throw createError({
        statusCode: 404,
        message: 'Product not found',
      })
    }

    return transformProductData(queryResult)
  }
  catch (error) {
    console.error(`Error fetching product with slug ${slug}:`, error)

    // Re-throw 404 errors
    if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 404) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: 'Failed to fetch product',
    })
  }
})
