<template>
  <LoadingScreen :is-visible="isVisible" />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
// Global SEO setup
import { useCartStore } from '~/stores/cart'

useHead({
  titleTemplate: (title?: string) => (title ? `${title} · JUOKSUT` : 'Juoksut Run Club'),
})

useSeoMeta({
  description: 'JUOKSUT Run Club.',
  ogTitle: 'JUOKSUT',
  ogDescription: 'JUOKSUT Run Club.',
  ogImage: 'https://cdn.juoksut.run/og-image.jpg',
  twitterCard: 'summary_large_image',
})

const isVisible = ref(true) // Shown from the server render until the app is ready
const pageReload = ref(true)

// Loading hides the page instead of covering it: iOS Safari paints a fixed
// full-screen layer into its status bar and toolbar. A reload hides the whole
// app; a navigation hides the page and the footer, so the nav stays.
useHead({
  htmlAttrs: {
    'data-loading': computed(() => isVisible.value ? (pageReload.value ? 'reload' : 'page') : undefined),
  },
})

const { isLoading } = useLoadingIndicator({
  throttle: 100,
})

onMounted(() => {
  setTimeout(() => {
    pageReload.value = false
    isVisible.value = false
  }, 600)
})

watch(isLoading, (newVal) => {
  if (newVal)
    isVisible.value = true
  else
    setTimeout(() => isVisible.value = false, 200)
})

const router = useRouter()
const cart = useCartStore()

router.beforeEach(() => {
  cart.closeCart() // Close cart when navigating to a new page
})
</script>

<style>
#__nuxt > :not(.loading-screen),
main,
main ~ * {
  transition: opacity 0.25s ease-in;
}
html[data-loading='reload'] #__nuxt > :not(.loading-screen),
html[data-loading='page'] main,
html[data-loading='page'] main ~ * {
  opacity: 0;
}

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
