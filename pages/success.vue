<template>
  <div class="text-center m-auto">
    <h1>Payment Successful!</h1>
    <p>Thank you for your order.</p>
    <NuxtLink to="/">
      <div class="my-[1em] mx-[1em] text-white uppercase bg-pink text-center border border-pink py-[0.6em] hover:bg-white hover:text-pink active:opacity-50">
        Go back home
      </div>
    </NuxtLink>
  </div>
</template>

<script setup>
import { useCartStore } from '~/stores/cart'

// Cear the cart after successful payment
onMounted(() => {
  const cart = useCartStore()
  cart.clearCart()
})
</script>
