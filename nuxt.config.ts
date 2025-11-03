// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/image',
    '@nuxt/eslint',
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
    'nitro-cloudflare-dev',
    // SEO
    '@nuxtjs/robots',
    '@nuxtjs/sitemap',
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
    layoutTransition: { name: 'layout', mode: 'out-in' },
    pageTransition: { name: 'page', mode: 'out-in' },

    head: {
      title: 'Juoksut Run Club',
      meta: [
        {
          name: 'description',
          content: 'Juoksut Run Club',
        },
        { name: 'theme-color', content: '#ffffff' },
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

  runtimeConfig: {
    public: {
      // Used for canonical URLs, sitemap and social tags
      siteUrl: 'https://juoksut.run',
      siteName: 'JUOKSUT',
      siteDescription: 'Juoksut Run Club',
      siteImage: 'https://juoksut.run/logo.svg',
    },
  },

  // Robots.txt configuration
  robots: {
    groups: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
    sitemap: ['/sitemap.xml'],
  },

  // Sitemap configuration
  sitemap: {
    strictNuxtContentPaths: false,
    sources: [
      // Let the module crawl your routes automatically
    ],
    xsl: false,
    autoLastmod: true,
    defaults: {
      changefreq: 'weekly',
      priority: 0.7,
    },
    // Exclude utility pages
    exclude: ['/success', '/cancel', '/nb-order-form'],
  },
})
