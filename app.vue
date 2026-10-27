<template>
  <LoadingScreen :is-visible="spinner" :below-nav="!pageReload" />
  <NuxtLayout>
    <NuxtPage :transition="pageTransition" />
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
const spinner = ref(true)

// Loading hides the page instead of covering it: iOS Safari paints a fixed
// full-screen layer into its status bar and toolbar. A reload hides the whole
// app; a navigation hides the page and the footer, so the nav stays.
useHead({
  htmlAttrs: {
    'data-loading': computed(() => isVisible.value ? (pageReload.value ? 'reload' : 'page') : undefined),
  },
})

onMounted(() => {
  setTimeout(() => {
    pageReload.value = false
    isVisible.value = false
    spinner.value = false
  }, 600)
})

// A navigation fades the page out at once, in step with the page transition
// (0.3s); the spinner only comes for a load slow enough to notice, so a quick
// one never flickers it. The next page's own enter transition brings it back.
const FADE_MS = 300
const SPINNER_DELAY_MS = 600
const nuxtApp = useNuxtApp()
let spinnerTimer: ReturnType<typeof setTimeout> | undefined
let fallback: ReturnType<typeof setTimeout> | undefined
let hiddenAt = 0

function endLoading() {
  clearTimeout(spinnerTimer)
  clearTimeout(fallback)
  if (pageReload.value)
    return
  isVisible.value = false
  spinner.value = false
}

nuxtApp.hook('page:loading:start', () => {
  if (pageReload.value)
    return
  clearTimeout(fallback)
  isVisible.value = true
  hiddenAt = Date.now()
  spinnerTimer = setTimeout(() => spinner.value = true, SPINNER_DELAY_MS)
})

nuxtApp.hook('page:loading:end', () => {
  clearTimeout(spinnerTimer)
  // A navigation that renders no new page (same page, aborted) has no enter.
  fallback = setTimeout(endLoading, 1000)
})

// The old page is already fading out with `main`, so its leave only waits for
// the rest of that fade instead of starting a second one.
const pageTransition = {
  name: 'page',
  mode: 'out-in' as const,
  onLeave: (_el: Element, done: () => void) => {
    setTimeout(done, isVisible.value ? Math.max(0, FADE_MS - (Date.now() - hiddenAt)) : FADE_MS)
  },
  onBeforeEnter: endLoading,
}

const router = useRouter()
const cart = useCartStore()

router.beforeEach(() => {
  cart.closeCart() // Close cart when navigating to a new page
})
</script>

<style>
/* Loading (see app.vue script). `main` fades out with the page transition and
   comes back at once: the next page's enter transition does the fade-in. */
#__nuxt > :not(.loading-screen),
main ~ *,
html[data-loading='page'] main {
  transition: opacity 0.3s ease;
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
</style>
