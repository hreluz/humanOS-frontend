import tailwindcss from '@tailwindcss/vite'

// Applies the saved theme before first paint so there's no light/dark flash.
const THEME_BOOT_SCRIPT = '(function(){try{var m=document.cookie.match(/(?:^|; )humanos_theme=([^;]*)/);var t=m?decodeURIComponent(m[1]):\'system\';var d=t===\'dark\'||(t===\'system\'&&window.matchMedia(\'(prefers-color-scheme: dark)\').matches);document.documentElement.classList.toggle(\'dark\',d)}catch(e){}})()'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint'],
  devtools: { enabled: true },
  app: {
    head: {
      title: 'HumanOS',
      htmlAttrs: { lang: 'en' },
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }],
      script: [{ innerHTML: THEME_BOOT_SCRIPT, tagPosition: 'head' }],
    },
  },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    // Overridable via NUXT_PUBLIC_API_BASE.
    public: { apiBase: 'http://localhost:8000/api' },
  },
  compatibilityDate: '2025-07-15',
  vite: {
    plugins: [tailwindcss()],
  },
  eslint: {
    // Matches the existing code style: no semicolons, single quotes, 2-space indent.
    config: { stylistic: { semi: false, quotes: 'single', indent: 2, commaDangle: 'always-multiline' } },
  },
})
