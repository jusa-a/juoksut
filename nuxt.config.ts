// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/image',
    '@nuxt/eslint',
    '@nuxtjs/tailwindcss',
    '@nuxt/content',
    '@pinia/nuxt',
  ],
  devtools: { enabled: true },

  routeRules: {
    '/': { prerender: true }, // Home page, prerendered at build time
    '/join': { prerender: true }, // About page, prerendered at build time
    '/shop': { prerender: true }, // Shop page, prerendered at build time
    '/shop/**': { prerender: true }, // Products pages, prerendered at build time
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
    // Options
  },

  tailwindcss: {
    // Options
  },
})