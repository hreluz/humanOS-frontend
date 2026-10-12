import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import type { AuthUser } from '~/types/auth'
import type { Profile } from '~/types/profile'
import * as authService from '~/services/authService'
import * as profileService from '~/services/profileService'

vi.mock('~/services/authService')
vi.mock('~/services/profileService')

const { navigateToMock } = vi.hoisted(() => ({ navigateToMock: vi.fn() }))
mockNuxtImport('navigateTo', () => navigateToMock)

const ana: AuthUser = { id: 1, name: 'Ana Torres', email: 'ana@example.com', role: 'user', emailVerifiedAt: null, createdAt: null }
const ben: AuthUser = { ...ana, id: 2, name: 'Ben Ito', email: 'ben@example.com' }
const profile: Profile = {
  birthDate: '1997-03-02', age: 29, sex: 'female', activityLevel: 'lightly_active', unitSystem: 'metric',
  height: 175, weight: 70, targetWeight: 74, heightCm: 175, weightKg: 70, targetWeightKg: 74, updatedAt: null,
}

const unauthorized = { statusCode: 401 }

function clearCookies() {
  for (const name of ['humanos_token', 'humanos_goal']) document.cookie = `${name}=; Max-Age=0; path=/`
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
    expect(auth.user.value).toEqual({ ...ana, profile: null, goal: null })
    expect(auth.profileLoaded.value).toBe(false)
    expect(auth.hasProfile.value).toBe(false)
    expect(auth.hasGoal.value).toBe(false)
    expect(document.cookie).toContain('humanos_token=')
  })

  it('fetchProfile stores the API profile, or null when there is none', async () => {
    vi.mocked(authService.login).mockResolvedValue({ token: '1|ana', user: ana })
    vi.mocked(profileService.getProfile).mockResolvedValueOnce(null).mockResolvedValueOnce(profile)
    const auth = useAuth()
    await auth.login(ana.email, 'secret-123')

    await auth.fetchProfile()
    expect(auth.profileLoaded.value).toBe(true)
    expect(auth.hasProfile.value).toBe(false)

    await auth.fetchProfile()
    expect(auth.user.value?.profile).toEqual(profile)
  })

  it('saveProfile PUTs the payload and stores the response', async () => {
    vi.mocked(authService.login).mockResolvedValue({ token: '1|ana', user: ana })
    vi.mocked(profileService.saveProfile).mockResolvedValue(profile)
    const auth = useAuth()
    await auth.login(ana.email, 'secret-123')

    const payload = { unitSystem: 'metric', birthDate: '1997-03-02', sex: 'female', height: 175, weight: 70, targetWeight: 74, activityLevel: 'lightly_active' } as const
    await auth.saveProfile(payload)

    expect(profileService.saveProfile).toHaveBeenCalledWith(payload)
    expect(auth.profile.value).toEqual(profile)
    expect(auth.hasProfile.value).toBe(true)
  })

  it('scopes the goal to the account that picked it and drops the profile on a new session', async () => {
    vi.mocked(authService.login).mockResolvedValueOnce({ token: '1|ana', user: ana }).mockResolvedValueOnce({ token: '2|ben', user: ben })
    vi.mocked(profileService.getProfile).mockResolvedValue(profile)
    const auth = useAuth()

    await auth.login(ana.email, 'secret-123')
    await auth.fetchProfile()
    auth.setGoal('build')
    await nextTick()
    expect(auth.user.value?.goal).toBe('build')
    expect(auth.goalLabel.value).toBe(goalLabelFor('build'))
    expect(document.cookie).toContain('humanos_goal=')

    await auth.login(ben.email, 'secret-123')
    expect(auth.hasGoal.value).toBe(false)
    expect(auth.profileLoaded.value).toBe(false)
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

  it.each([
    ['a 401', unauthorized],
    ['a server error', { statusCode: 500 }],
    ['a network error', new TypeError('fetch failed')],
  ])('signOut still signs out locally on %s', async (_, failure) => {
    vi.mocked(authService.login).mockResolvedValue({ token: '1|abc', user: ana })
    vi.mocked(authService.logout).mockRejectedValue(failure)
    const auth = useAuth()
    await auth.login(ana.email, 'secret-123')

    await auth.signOut()

    expect(auth.isAuthenticated.value).toBe(false)
    expect(auth.hasToken.value).toBe(false)
    expect(auth.signingOut.value).toBe(false)
    expect(auth.profileLoaded.value).toBe(false)
    expect(navigateToMock).toHaveBeenCalledWith({ path: '/login', query: { signedOut: '1' } })
  })

  it('signOut resets other state to its defaults instead of deleting it', async () => {
    vi.mocked(authService.login).mockResolvedValue({ token: '1|ana', user: ana })
    vi.mocked(authService.logout).mockResolvedValue()
    vi.mocked(profileService.getProfile).mockResolvedValue(profile)
    // Stands in for state owned by a Nuxt module, like DevTools' `__nuxt_devtools__`, which crashes when deleted.
    const moduleState = useState<{ timeSsrStart?: number }>('module-state', () => ({}))
    moduleState.value = { timeSsrStart: 1 }
    const auth = useAuth()
    await auth.login(ana.email, 'secret-123')
    await auth.fetchProfile()

    await auth.signOut()

    expect(useState('module-state').value).toEqual({})
    expect(auth.profileLoaded.value).toBe(false)
  })

  it('signOut sends one request when called twice', async () => {
    vi.mocked(authService.login).mockResolvedValue({ token: '1|abc', user: ana })
    vi.mocked(authService.logout).mockResolvedValue()
    const auth = useAuth()
    await auth.login(ana.email, 'secret-123')

    const first = auth.signOut()
    expect(auth.signingOut.value).toBe(true)
    await auth.signOut()
    await first

    expect(authService.logout).toHaveBeenCalledTimes(1)
  })
})
