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

  nitro: {
    // Ensure SSR deploy targets Cloudflare Pages runtime (needed for D1 bindings)
    preset: 'cloudflare_pages',
    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
    },
  },

  app: {
    layoutTransition: { name: 'layout', mode: 'out-in' },
    pageTransition: { name: 'page', mode: 'out-in' },

    head: {
      meta: [
        {
          name: 'description',
          content: 'Juoksut Run Club',
        },
        // { name: 'theme-color', content: '#ffffff' },
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
})
