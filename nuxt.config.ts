// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    devtools: { enabled: true },
    modules: ['@nuxtjs/tailwindcss'],
    app: {
        baseURL: '/juoksut/',
        head: {
            title: 'Juoksut Run Club',
            meta: [
                {
                    name: 'description',
                    content: 'Juoksut Run Club'
                },
                //{ name: 'theme-color', content: '#FF639A' },
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
                    content: ''
                }
            ],
            htmlAttrs: {
                lang: 'en'
            }
        }
    }
})
