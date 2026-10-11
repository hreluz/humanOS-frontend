import { defineVitestConfig } from '@nuxt/test-utils/config'

// Unit tests run in a Nuxt environment (auto-imports, useCookie, useState). Files live in tests/nuxt (included by Nuxt's app tsconfig); E2E lives in tests/e2e.
export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    include: ['tests/nuxt/**/*.test.ts'],
  },
})
