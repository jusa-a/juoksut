import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  const KV = event.context.cloudflare?.env?.KV
  const { productId } = event.context.params

  try {
    // Fetch stock information from KV
    const stockData = await KV.get(`stock_${productId}`, { type: 'json' })

    if (stockData) {
      return stockData
    }

    return {}
  }
  catch (error) {
    console.error('Error fetching stock data:', error)
    throw createError({ statusCode: 500, message: 'Failed to fetch stock data' })
  }
})
