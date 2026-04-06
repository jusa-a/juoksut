import { useRequestEvent } from '#app'
import { defineStore } from 'pinia'

export const useProductStore = defineStore('products', {
  state: () => ({
    products: {}, // Normalize state: store products as an object with slugs as keys
    loading: false,
    error: null,
  }),

  getters: {
    isOutOfStock: state => (slug) => {
      const product = state.products[slug]
      return product ? product.totalStock === 0 : true
    },
    getProduct: state => slug => state.products[slug] || null,
  },

  actions: {
    async fetchProducts() {
      if (this.loading)
        return // Prevent duplicate fetches
      this.loading = true
      this.error = null

      try {
        let products

        // During SSR, $fetch creates a sub-request with a fresh event that lacks the
        // Cloudflare binding context, so D1 would be undefined. Access D1 directly instead.
        if (import.meta.server) {
          const event = useRequestEvent()
          const D1 = event?.context?.cloudflare?.env?.D1
          if (D1) {
            const { fetchProductData, transformProductData } = await import('~/server/utils/productUtils.js')
            const raw = await fetchProductData(D1)
            products = raw.map(transformProductData)
          }
        }

        if (!products) {
          products = await $fetch('/api/products')
        }

        products.forEach((product) => {
          this.products[product.slug] = product
        })
      }
      catch (error) {
        console.error('Error fetching products:', error)
        this.error = 'Failed to fetch products'
      }
      finally {
        this.loading = false
      }
    },

    async fetchSingleProduct(slug) {
      const existingProduct = this.products[slug]
      if (existingProduct) {
        // If images already exist, return the product without fetching images
        if (existingProduct.images)
          return existingProduct
      }

      this.loading = true
      this.error = null

      try {
        let product

        // Same as fetchProducts: bypass $fetch during SSR to retain Cloudflare D1 context
        if (import.meta.server) {
          const event = useRequestEvent()
          const D1 = event?.context?.cloudflare?.env?.D1
          if (D1 && !existingProduct) {
            const { fetchProductData, transformProductData } = await import('~/server/utils/productUtils.js')
            const raw = await fetchProductData(D1, slug)
            if (raw)
              product = transformProductData(raw)
          }
        }

        if (!product)
          product = existingProduct || await $fetch(`/api/products/${slug}`)

        this.products[slug] = product // Add or update the product in the state

        // Fetch images only if they don't already exist
        if (!product.images) {
          try {
            const { images } = await $fetch(`/api/products/${slug}/images`)
            this.products[slug].images = images // Update the product with images
          }
          catch (imageError) {
            // Keep product usable even if image lookup fails
            console.warn(`Error fetching images for product ${slug}:`, imageError)
            this.products[slug].images = []
          }
        }

        return this.products[slug]
      }
      catch (error) {
        console.error(`Error fetching product with slug ${slug}:`, error)
        this.error = `Failed to fetch product: ${slug}`
      }
      finally {
        this.loading = false
      }
    },
  },
})
