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
</script>
