<template>
  <div class="text-center m-auto">
    <h1 class="text-red-600">Payment Cancelled</h1>
    <p class="text-red-500">Your order was not completed.</p>
    <p v-if="reservationMessage" class="text-red-500">{{ reservationMessage }}</p>
    <NuxtLink to="/">
      <div class="my-[1em] mx-[1em] text-white uppercase bg-red-600 text-center border border-red-600 py-[0.6em] hover:bg-white hover:text-red-600 active:opacity-50">
        Try again
      </div>
    </NuxtLink>
  </div>
</template>

<script setup>
const route = useRoute()
const reservationId = typeof route.query.reservation === 'string' ? route.query.reservation : null
const reservationMessage = ref('')

onMounted(async () => {
  if (!reservationId)
    return

  try {
    const result = await $fetch('/api/checkout-reservation/cancel', {
      method: 'POST',
      body: { reservationId },
    })
    if (result.released)
      reservationMessage.value = 'Your reserved place has been released.'
  }
  catch (error) {
    // The 30-minute Stripe expiry remains the fallback if the browser leaves
    // before this request completes.
    console.error('Could not release cancelled reservation:', error)
  }
})
</script>
