import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import type { RouteLocationNormalized } from 'vue-router'
import middleware from '~/middleware/auth.global'

const { auth, navigateToMock } = vi.hoisted(() => ({
  auth: { token: false, account: false, profile: false, fetchMe: vi.fn() },
  // Returns undefined, so the test app's own boot navigation passes through instead of redirecting in a loop.
  navigateToMock: vi.fn<(path: string) => void>(),
}))

mockNuxtImport('navigateTo', () => navigateToMock)
// Plain getters (not computed): `auth` isn't reactive, and the middleware re-reads state after fetchMe.
mockNuxtImport('useAuth', () => () => ({
  hasToken: { get value() { return auth.token } },
  isAuthenticated: { get value() { return auth.account } },
  hasProfile: { get value() { return auth.profile } },
  fetchMe: auth.fetchMe,
}))

/** Runs the middleware for `path` and returns where it redirected, or undefined if it let the navigation through. */
async function run(path: string) {
  navigateToMock.mockClear()
  await middleware({ path } as RouteLocationNormalized, ref().value)
  return navigateToMock.mock.calls[0]?.[0]
}

function setSession(state: 'signed-out' | 'no-profile' | 'with-profile') {
  auth.token = state !== 'signed-out'
  auth.account = state !== 'signed-out'
  auth.profile = state === 'with-profile'
}

beforeEach(() => {
  vi.clearAllMocks()
  auth.fetchMe.mockReset()
  setSession('signed-out')
})

describe('auth middleware', () => {
  describe('signed out', () => {
    it.each(['/login', '/signup', '/forgot-password', '/reset-password'])('allows %s', async (path) => {
      expect(await run(path)).toBeUndefined()
    })

    it.each(['/', '/food', '/profile', '/onboarding'])('sends %s to /login', async (path) => {
      expect(await run(path)).toBe('/login')
    })
  })

  describe('signed in without a profile', () => {
    beforeEach(() => setSession('no-profile'))

    it('allows /onboarding', async () => {
      expect(await run('/onboarding')).toBeUndefined()
    })

    it.each(['/', '/login', '/profile'])('sends %s to /onboarding', async (path) => {
      expect(await run(path)).toBe('/onboarding')
    })
  })

  describe('signed in with a profile', () => {
    beforeEach(() => setSession('with-profile'))

    it.each(['/', '/food', '/profile'])('allows %s', async (path) => {
      expect(await run(path)).toBeUndefined()
    })

    it.each(['/login', '/signup', '/forgot-password', '/reset-password', '/onboarding'])('sends %s to /', async (path) => {
      expect(await run(path)).toBe('/')
    })
  })

  it('restores the account with fetchMe when only the token is known', async () => {
    auth.token = true
    auth.fetchMe.mockImplementation(async () => {
      auth.account = true
      auth.profile = true
    })

    expect(await run('/food')).toBeUndefined()
    expect(auth.fetchMe).toHaveBeenCalledOnce()
  })

  it('does not call fetchMe without a token', async () => {
    await run('/food')
    expect(auth.fetchMe).not.toHaveBeenCalled()
  })

  it('treats a token rejected by fetchMe as signed out', async () => {
    auth.token = true
    auth.fetchMe.mockImplementation(async () => { auth.token = false })

    expect(await run('/food')).toBe('/login')
  })
})
