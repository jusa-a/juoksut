import { defineEventHandler } from 'h3'
import { fetchProductData, transformProductData } from '../../utils/productUtils'

export default defineEventHandler(async (event) => {
  const { slug } = event.context.params
  const D1 = event.context.cloudflare?.env?.D1

  try {
    const queryResult = await fetchProductData(D1, slug)
    if (!queryResult)
      throw createError({ statusCode: 404, message: 'Product not found' })

    return transformProductData(queryResult)
  }
  catch (error) {
    console.error(`Error fetching product with slug ${slug}:`, error)
    throw createError({ statusCode: 500, message: 'Failed to fetch product' })
  }
})
