<template>
  <div class="flex flex-col min-h-screen justify-between">
    <Nav :is-cart-open="isCartOpen" :toggle-cart="toggleCart" />
    <Cart :is-cart-open="isCartOpen" :toggle-cart="toggleCart" />
    <main class="flex-1 flex flex-col">
      <slot />
    </main>
    <Footer />
  </div>
</template>

<script setup>
const isCartOpen = ref(false)

function toggleCart() {
  isCartOpen.value = !isCartOpen.value

  // Prevent scrolling when cart is open
  document.body.style.overflow = isCartOpen.value ? 'hidden' : 'auto'
}

// Close cart and prevent navigation when cart is open
const router = useRouter()

// Use router navigation guard to handle back navigation
onMounted(() => {
  router.beforeEach((to, from, next) => {
    // If the cart is open, prevent navigation
    if (isCartOpen.value) {
      // Close the cart
      isCartOpen.value = false
      // Prevent the navigation from happening
      next(false)
    }
    else {
      // Allow navigation if the cart is not open
      next()
    }
  })
})
</script>
