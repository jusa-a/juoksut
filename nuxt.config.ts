// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/image',
    '@nuxt/eslint',
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
    'nitro-cloudflare-dev',
  ],
  devtools: { enabled: true },

  routeRules: {
    '/': { prerender: true },
    '/join': { prerender: true },
    '/shop': { ssr: false },
    '/shop/**': { ssr: false },
    '/success': { ssr: false },
    '/nb-order-form': { ssr: false },
  },

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      title: 'Juoksut Run Club',
      meta: [
        {
          name: 'description',
          content: 'Juoksut Run Club',
        },
        { name: 'theme-color', content: '#ffffff' },
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1, viewport-fit=cover',
        },
        {
          name: 'mobile-web-app-capable',
          content: 'yes',
        },
        {
          name: 'apple-mobile-web-app-status-bar-style',
          content: 'black-translucent',
        },
        { hid: 'og:type', property: 'og:type', content: 'website' },
        {
          hid: 'og:title',
          property: 'og:title',
          content: 'Juoksut Run Club',
        },
        {
          hid: 'og:desc',
          property: 'og:description',
          content: 'Juoksut Run Club',
        },
        {
          hid: 'og:image',
          property: 'og:image',
          content: '',
        },
        {
          hid: 'og:url',
          property: 'og:url',
          content: 'https://www.juoksut.run',
        },
      ],
      link: [
        {
          rel: 'preload',
          href: 'https://cdn.juoksut.run/juoksut.mp4',
          as: 'video',
          type: 'video/mp4',
          fetchpriority: 'high',
        },
        {
          rel: 'apple-touch-icon',
          sizes: '180x180',
          href: '/apple-touch-icon.png',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '32x32',
          href: '/favicon-32x32.png',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '16x16',
          href: '/favicon-16x16.png',
        },
        { rel: 'manifest', href: '/site.webmanifest' },
      ],
      htmlAttrs: {
        lang: 'en',
      },
    },
  },

  compatibilityDate: '2025-03-08',

  image: {
    domains: ['cdn.juoksut.run'],
  },

  tailwindcss: {
    // Options
  },
})
