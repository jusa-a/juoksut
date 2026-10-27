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

// A navigation fades `main` out at once and back in when the next page is in;
// the page transition only sequences the swap (no CSS of its own), so a single
// layer fades. The spinner only comes for a load slow enough to notice, so a
// quick one never flickers it.
const FADE_MS = 200 // = --fade-out
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
  delete document.documentElement.dataset.loading
}

nuxtApp.hook('page:loading:start', () => {
  if (pageReload.value)
    return
  clearTimeout(fallback)
  isVisible.value = true
  hiddenAt = Date.now()
  spinnerTimer = setTimeout(() => spinner.value = true, SPINNER_DELAY_MS)
  // The router awaits this hook: start the fade now (useHead writes the
  // attribute later) and hold the navigation until it has finished, so
  // building the next page can't stall it on Safari.
  document.documentElement.dataset.loading = 'page'
  return new Promise<void>(resolve => setTimeout(resolve, FADE_MS))
})

nuxtApp.hook('page:loading:end', () => {
  clearTimeout(spinnerTimer)
  // A navigation that renders no new page (same page, aborted) has no enter.
  fallback = setTimeout(endLoading, 1000)
})

// The old page leaves once `main` has faded out; the new one fades in with it.
const pageTransition = {
  mode: 'out-in' as const,
  css: false,
  onLeave: (_el: Element, done: () => void) => {
    setTimeout(done, Math.max(0, FADE_MS - (Date.now() - hiddenAt)))
  },
  // Two frames for the new page to be laid out and drawn while still hidden,
  // so the fade-in starts without a jump.
  onEnter: (_el: Element, done: () => void) => {
    done()
    requestAnimationFrame(() => requestAnimationFrame(endLoading))
  },
}

const router = useRouter()
const cart = useCartStore()

router.beforeEach(() => {
  cart.closeCart() // Close cart when navigating to a new page
})
</script>

<style>
/* Fades out quickly, comes in a little slower and softer (see the script). */
:root {
  --fade-out: opacity 0.2s ease;
  --fade-in: opacity 0.35s ease-in-out;
}
#__nuxt > :not(.loading-screen),
main,
main ~ * {
  transition: var(--fade-in);
}
/* Safari builds main's layer ahead of time; built when the fade starts, it
   costs ~60ms on an image-heavy page and the fade jumps. */
main {
  will-change: opacity;
}
html[data-loading] #__nuxt > :not(.loading-screen),
html[data-loading='page'] main,
html[data-loading='page'] main ~ * {
  transition: var(--fade-out);
}
html[data-loading='reload'] #__nuxt > :not(.loading-screen),
html[data-loading='page'] main,
html[data-loading='page'] main ~ * {
  opacity: 0;
}
</style>
