import { defineStore } from 'pinia'

export const useProductStore = defineStore('products', {
  state: () => ({
    products: [],
  }),

  getters: {
    isOutOfStock: state => (slug) => {
      const product = state.products.find(p => p.slug === slug)
      return product ? product.totalStock === 0 : true
    },
  },

  actions: {
    async fetchProducts() {
      try {
        const products = await $fetch('/api/products')
        products.forEach((product) => {
          const existingProduct = this.products.find(p => p.slug === product.slug)
          if (existingProduct) {
            // Update only missing fields
            Object.keys(product).forEach((key) => {
              if (existingProduct[key] === undefined) {
                existingProduct[key] = product[key]
              }
            })
          }
          else {
            this.products.push(product)
          }
        })
      }
      catch (error) {
        console.error('Error fetching products:', error)
      }
    },

    async fetchSingleProduct(slug) {
      try {
        // Find the product in the state
        let product = this.products.find(p => p.slug === slug)

        if (!product) {
          product = await $fetch(`/api/products/${slug}`)
          this.products.push(product)
        }

        if (!product.images) {
          // Fetch and update images
          const { images } = await $fetch(`/api/products/${slug}/images`)
          // Update the product object directly for better reactivity
          product.images = images
        }

        return product
      }
      catch (error) {
        console.error(`Error fetching product with slug ${slug}:`, error)
        // throw error // Re-throw the error to handle it in the calling code
      }
    },
  },
})
