<template>
  <LoadingScreen :is-visible="isVisible" :page-reload="pageReload" />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useCartStore } from '~/stores/cart'

const isVisible = ref(true) // Force visible on reload
const pageReload = ref(true) // // Ref for page reload detection

const { isLoading, start, finish } = useLoadingIndicator({
  throttle: 100,
})

// Loading screen on reload
onMounted(() => {
  setTimeout(() => {
    document.body.style.overflow = 'auto'
    pageReload.value = false
    isVisible.value = false
  }, 600) // Hide after a delay
})

watch(isLoading, (newVal) => {
  if (newVal) {
    isVisible.value = true
    document.body.style.overflow = 'hidden'
  }
  else {
    setTimeout(() => {
      isVisible.value = false
      document.body.style.overflow = 'auto'
    }, 200)
  }
})

const router = useRouter()
const cart = useCartStore()

router.beforeEach(() => {
  cart.closeCart() // Close cart when navigating to a new page
})
</script>

<style>
.page-enter-active,
.page-leave-active {
  transition: all 0.3s;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
}

.layout-enter-active,
.layout-leave-active {
  transition: all 0.4s;
}
.layout-enter-from,
.layout-leave-to {
  opacity: 0;
}
</style>
