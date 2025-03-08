/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Helvetica', 'Arial', 'sans-serif'],
        serif: ['"JUOKSUT Garamond"', 'Georgia', 'serif'],
      },
      colors: {
        pink: '#FF639A',
      },
    },
  },
  content: {
    files: [
      './components/**/*.{vue,js,jsx,mjs,ts,tsx}',
      './layouts/**/*.{vue,js,jsx,mjs,ts,tsx}',
      './pages/**/*.{vue,js,jsx,mjs,ts,tsx}',
      './plugins/**/*.{js,ts,mjs}',
      './composables/**/*.{js,ts,mjs}',
      './utils/**/*.{js,ts,mjs}',
      './{A,a}pp.{vue,js,jsx,mjs,ts,tsx}',
      './{E,e}rror.{vue,js,jsx,mjs,ts,tsx}',
      './app.config.{js,ts,mjs}',
      './app/spa-loading-template.html',
    ],
  },
  plugins: [],
}
