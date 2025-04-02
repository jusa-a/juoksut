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
        const products = await $fetch('/api/products')
        products.forEach((product) => {
          this.products[product.slug] = product // Store products by slug
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
        const product = existingProduct || await $fetch(`/api/products/${slug}`)
        this.products[slug] = product // Add or update the product in the state

        // Fetch images only if they don't already exist
        if (!product.images) {
          const { images } = await $fetch(`/api/products/${slug}/images`)
          this.products[slug].images = images // Update the product with images
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
