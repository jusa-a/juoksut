// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@nuxt/image'],

  app: {
      // baseURL: '/juoksut/',
      head: {
          title: 'Juoksut Run Club',
          meta: [
              {
                  name: 'description',
                  content: 'Juoksut Run Club'
              },
              { name: 'theme-color', content: '#ffffff' },
              {
                  name: 'viewport',
                  content:
                      'width=device-width, initial-scale=1, viewport-fit=cover'
              },
              {
                  name: 'apple-mobile-web-app-capable',
                  content: 'yes'
              },
              {
                  name: 'apple-mobile-web-app-status-bar-style',
                  content: 'black-translucent'
              },
              { hid: 'og:type', property: 'og:type', content: 'website' },
              {
                  hid: 'og:title',
                  property: 'og:title',
                  content: 'Juoksut Run Club'
              },
              {
                  hid: 'og:desc',
                  property: 'og:description',
                  content: 'Juoksut Run Club'
              },
              {
                  hid: 'og:image',
                  property: 'og:image',
                  content: ''
              },
              {
                  hid: 'og:url',
                  property: 'og:url',
                  content: 'https://www.juoksut.run'
              }
          ],
          link: [
              {
                  rel: 'apple-touch-icon',
                  sizes: '180x180',
                  href: '/apple-touch-icon.png'
              },
              {
                  rel: 'icon',
                  type: 'image/png',
                  sizes: '32x32',
                  href: '/favicon-32x32.png'
              },
              {
                  rel: 'icon',
                  type: 'image/png',
                  sizes: '16x16',
                  href: '/favicon-16x16.png'
              },
              { rel: 'manifest', href: '/site.webmanifest' }
          ],
          htmlAttrs: {
              lang: 'en'
          }
      }
  },

  image: {
      // Options
  },

  compatibilityDate: '2025-03-08'
})