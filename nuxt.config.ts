import tailwindcss from '@tailwindcss/vite'

// Applies the saved theme before first paint so there's no light/dark flash.
const THEME_BOOT_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|; )humanos_theme=([^;]*)/);var t=m?decodeURIComponent(m[1]):'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){}})()`

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  app: {
    head: {
      title: 'HumanOS',
      htmlAttrs: { lang: 'en' },
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }],
      script: [{ innerHTML: THEME_BOOT_SCRIPT, tagPosition: 'head' }],
    },
  },
})
