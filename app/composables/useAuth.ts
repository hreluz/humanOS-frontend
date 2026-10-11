import type { AuthSession, AuthUser, RegisterPayload, User, UserProfile } from '~/types/auth'
import * as authService from '~/services/authService'
import { TOKEN_COOKIE } from '~/services/api'

interface StoredProfile {
  userId: number
  profile: UserProfile
}

const DAY = 60 * 60 * 24
const TOKEN_OPTS = { default: (): string | null => null, sameSite: 'lax' as const, maxAge: DAY * 30 }
const PROFILE_OPTS = { default: (): StoredProfile | null => null, sameSite: 'lax' as const, maxAge: DAY * 365 }

export function useAuth() {
  const token = useCookie<string | null>(TOKEN_COOKIE, TOKEN_OPTS)
  const storedProfile = useCookie<StoredProfile | null>('humanos_profile', PROFILE_OPTS)
  const account = useState<AuthUser | null>('auth-user', () => null)
  const signingOut = useState('auth-signing-out', () => false)

  // A profile saved by another account on this browser is ignored.
  const profile = computed(() =>
    account.value && storedProfile.value?.userId === account.value.id ? storedProfile.value.profile : null,
  )
  const user = computed<User | null>(() => account.value && { ...account.value, profile: profile.value })

  const hasToken = computed(() => !!token.value)
  const isAuthenticated = computed(() => !!account.value)
  const hasProfile = computed(() => !!profile.value)
  const userName = computed(() => user.value?.name || 'You')
  const firstName = computed(() => userName.value.split(' ')[0])
  const initial = computed(() => userName.value[0]!.toUpperCase())
  const goalLabel = computed(() => goalLabelFor(profile.value?.goal))

  function startSession(session: AuthSession) {
    token.value = session.token
    account.value = session.user
  }

  function clearSession() {
    token.value = null
    account.value = null
  }

  async function login(email: string, password: string) {
    startSession(await authService.login(email, password))
  }

  async function register(payload: RegisterPayload) {
    startSession(await authService.register(payload))
  }

  /** Restores the account from the token; an invalid or expired token is cleared. */
  async function fetchMe() {
    try {
      account.value = await authService.me()
    }
    catch (err) {
      if (apiStatus(err) !== 401) throw err
      clearSession()
    }
  }

  async function saveProfile(value: UserProfile) {
    if (!account.value) return
    storedProfile.value = { userId: account.value.id, profile: await authService.saveProfile(value) }
  }

  async function signOut() {
    if (signingOut.value) return
    signingOut.value = true
    try {
      try {
        await authService.logout()
      }
      catch {
        // A failed revoke (offline, 5xx, already-expired token) still signs out on this browser.
      }
      clearSession()
      await navigateTo({ path: '/login', query: { signedOut: '1' } })
      clearNuxtState(key => !['auth-user', 'auth-signing-out', 'theme-preference'].includes(key))
    }
    finally {
      signingOut.value = false
    }
  }

  return {
    user, hasToken, isAuthenticated, hasProfile, signingOut, userName, firstName, initial, goalLabel,
    login, register, fetchMe, saveProfile, signOut,
  }
}
