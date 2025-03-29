import { defineStore } from 'pinia'

export const useProductStore = defineStore('products', {
  state: () => ({
    products: [], // List of products
    stockData: {}, // Stock data for products
    stripePrices: {}, // Stripe price data for products
  }),

  getters: {
    getStock: state => productId => state.stockData[productId] || {},
    isOutOfStock: state => (productId) => {
      const stock = state.stockData[productId] || {}
      return Object.values(stock).every(quantity => quantity === 0)
    },
  },

  actions: {
    setProducts(products) {
      this.products = products
    },

    async fetchStockAndPrices(products) {
      try {
        const pricesResponse = await $fetch('/api/stripe-prices')
        this.stripePrices = pricesResponse

        await Promise.all(
          products.map(async (product) => {
            const stockResponse = await $fetch(`/api/stock/${product.slug}`)
            this.stockData[product.slug] = stockResponse

            if (this.stripePrices[product.slug]) {
              product.price = this.stripePrices[product.slug].price
            }
          }),
        )
      }
      catch (error) {
        console.error('Error fetching stock and prices:', error)
      }
    },

    async fetchSingleProductData(productSlug) {
      try {
        // Fetch price for the single product
        if (!this.stripePrices[productSlug]) {
          const pricesResponse = await $fetch('/api/stripe-prices')
          this.stripePrices = pricesResponse
        }

        // Fetch stock for the single product
        if (!this.stockData[productSlug]) {
          const stockResponse = await $fetch(`/api/stock/${productSlug}`)
          this.stockData[productSlug] = stockResponse
        }
      }
      catch (error) {
        console.error(`Error fetching data for product ${productSlug}:`, error)
      }
    },
  },
})
