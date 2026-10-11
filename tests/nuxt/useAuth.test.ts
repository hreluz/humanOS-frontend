import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import type { AuthUser, UserProfile } from '~/types/auth'
import * as authService from '~/services/authService'

vi.mock('~/services/authService')

const { navigateToMock } = vi.hoisted(() => ({ navigateToMock: vi.fn() }))
mockNuxtImport('navigateTo', () => navigateToMock)

const ana: AuthUser = { id: 1, name: 'Ana Torres', email: 'ana@example.com', role: 'user', emailVerifiedAt: null, createdAt: null }
const ben: AuthUser = { ...ana, id: 2, name: 'Ben Ito', email: 'ben@example.com' }
const profile: UserProfile = { goal: 'build', age: '29', height: '175', weight: '70', target: '74', activity: 'Light' }

const unauthorized = { statusCode: 401 }

function clearCookies() {
  for (const name of ['humanos_token', 'humanos_profile']) document.cookie = `${name}=; Max-Age=0; path=/`
}

beforeEach(() => {
  vi.resetAllMocks()
  clearNuxtState()
  clearCookies()
})

describe('useAuth', () => {
  it('login stores the token and account, with no profile yet', async () => {
    vi.mocked(authService.login).mockResolvedValue({ token: '1|abc', user: ana })
    const auth = useAuth()

    await auth.login('ana@example.com', 'secret-123')
    await nextTick()

    expect(auth.isAuthenticated.value).toBe(true)
    expect(auth.hasToken.value).toBe(true)
    expect(auth.user.value).toEqual({ ...ana, profile: null })
    expect(auth.hasProfile.value).toBe(false)
    expect(document.cookie).toContain('humanos_token=')
  })

  it('scopes the saved profile to the account that saved it', async () => {
    vi.mocked(authService.login).mockResolvedValueOnce({ token: '1|ana', user: ana }).mockResolvedValueOnce({ token: '2|ben', user: ben })
    vi.mocked(authService.saveProfile).mockImplementation(async p => p)
    const auth = useAuth()

    await auth.login(ana.email, 'secret-123')
    await auth.saveProfile(profile)
    expect(auth.user.value?.profile).toEqual(profile)
    expect(auth.goalLabel.value).toBe(goalLabelFor('build'))

    await auth.login(ben.email, 'secret-123')
    expect(auth.hasProfile.value).toBe(false)
    expect(auth.user.value?.profile).toBeNull()
  })

  it('fetchMe restores the account from the token', async () => {
    vi.mocked(authService.me).mockResolvedValue(ana)
    const auth = useAuth()

    await auth.fetchMe()

    expect(auth.user.value?.email).toBe(ana.email)
  })

  it('fetchMe clears the session on a 401', async () => {
    vi.mocked(authService.login).mockResolvedValue({ token: '1|abc', user: ana })
    vi.mocked(authService.me).mockRejectedValue(unauthorized)
    const auth = useAuth()
    await auth.login(ana.email, 'secret-123')

    await auth.fetchMe()

    expect(auth.isAuthenticated.value).toBe(false)
    expect(auth.hasToken.value).toBe(false)
  })

  it('fetchMe rethrows anything but a 401', async () => {
    vi.mocked(authService.me).mockRejectedValue({ statusCode: 500 })
    await expect(useAuth().fetchMe()).rejects.toEqual({ statusCode: 500 })
  })

  it('signOut ignores a 401, clears the session and goes to /login', async () => {
    vi.mocked(authService.login).mockResolvedValue({ token: '1|abc', user: ana })
    vi.mocked(authService.logout).mockRejectedValue(unauthorized)
    const auth = useAuth()
    await auth.login(ana.email, 'secret-123')

    await auth.signOut()

    expect(auth.isAuthenticated.value).toBe(false)
    expect(auth.hasToken.value).toBe(false)
    expect(navigateToMock).toHaveBeenCalledWith('/login')
  })
})
