// https://nuxt.com/docs/api/configuration/nuxt-config

// Content-Security-Policy is shipped Report-Only first so it can't break the live
// site — watch the browser console for violations, then rename the header to
// `Content-Security-Policy` to enforce. 'unsafe-inline' is required for now
// because Nuxt injects inline hydration scripts/styles without nonces.
const csp = [
  'default-src \'self\'',
  'script-src \'self\' \'unsafe-inline\' https://cdn.tickettailor.com https://tally.so',
  'style-src \'self\' \'unsafe-inline\'',
  'img-src \'self\' data: https://cdn.juoksut.run https://*.cdninstagram.com https://*.tickettailor.com https://tally.so',
  'media-src \'self\' https://cdn.juoksut.run https://*.cdninstagram.com',
  'font-src \'self\'',
  'connect-src \'self\'',
  'frame-src https://tally.so https://*.tickettailor.com https://docs.google.com',
  'frame-ancestors \'none\'',
  'base-uri \'self\'',
  'form-action \'self\' https://docs.google.com',
].join('; ')

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'SAMEORIGIN',
  'Content-Security-Policy-Report-Only': csp,
}

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

  nitro: {
    // Ensure SSR deploy targets Cloudflare Pages runtime (needed for D1 bindings)
    preset: 'cloudflare_pages',
    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
    },
  },

  routeRules: {
    // Security headers on every response (CSP is Report-Only — see note above)
    '/**': { headers: securityHeaders },
    '/': { prerender: true },
    '/join': { prerender: true },
    // Keep shop pages server-rendered so OG/meta tags are available to crawlers
    '/shop': { prerender: false },
    '/shop/**': { prerender: false },
    // Archive: SSR for meta tags, videos load client-side (D1 not available in SSR sub-requests)
    '/archive': { prerender: false },
    '/success': { ssr: false },
    '/nb-order-form': { ssr: false },
  },

  app: {
    layoutTransition: { name: 'layout', mode: 'out-in' },
    pageTransition: { name: 'page', mode: 'out-in' },

    head: {
      meta: [
        { property: 'og:site_name', content: 'JUOKSUT' },
        // { name: 'theme-color', content: '#ffffff' },
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
    domains: ['cdn.juoksut.run'],
  },

  tailwindcss: {
    // Options
  },

  runtimeConfig: {
    public: {
      // Used for canonical URLs, sitemap and social tags
      siteUrl: 'https://juoksut.run',
      siteName: 'JUOKSUT',
      siteDescription: 'JUOKSUT Run Club.',
      siteImage: 'https://cdn.juoksut.run/og-image.jpg',
    },
  },

})
