import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [],
    isCartOpen: false,
    isLoading: false,
    isHoverDisabled: false,
  }),

  getters: {
    totalPrice: state => state.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    totalItems: state => state.items.reduce((sum, item) => sum + item.quantity, 0),
  },

  actions: {
    addItem(product) {
      this.isLoading = true
      this.isHoverDisabled = true

      const existing = this.items.find(item => item.id === product.slug && item.size === product.size)
      if (existing) {
        existing.quantity++
      }
      else {
        this.items.push({ ...product, quantity: 1 })
      }

      // Delay before opening the cart
      setTimeout(() => {
        this.toggleCart()

        // After opening the cart, keep hover disabled for a short time
        setTimeout(() => {
          this.isLoading = false
          this.isHoverDisabled = false
        }, 600)
      }, 600) // Initial delay before opening cart
    },

    removeItem(id, size) {
      this.isLoading = true

      setTimeout(() => {
        this.items = this.items.filter(item => !(item.id === id && item.size === size))
        this.isLoading = false
      }, 500) // Delay before removing item
    },

    toggleCart() {
      this.isCartOpen = !this.isCartOpen
      document.body.style.overflow = this.isCartOpen ? 'hidden' : 'auto' // Prevent scrolling when cart is open
    },

    closeCart() {
      this.isCartOpen = false
      document.body.style.overflow = 'auto'
    },

    updateQuantity(id, size, quantity) {
      const item = this.items.find(item => item.id === id && item.size === size)
      if (item) {
        item.quantity = quantity
      }
    },

    clearCart() {
      this.items = []
      localStorage.removeItem('cart') // Clear the cart data from localStorage
    },
  },

  persist: {
    storage: piniaPluginPersistedstate.localStorage(),
  },
})
