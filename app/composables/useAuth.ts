import type { AuthSession, AuthUser, GoalKey, RegisterPayload, User } from '~/types/auth'
import type { Profile, ProfilePayload } from '~/types/profile'
import * as authService from '~/services/authService'
import * as profileService from '~/services/profileService'
import { TOKEN_COOKIE } from '~/services/api'

// The backend has no goal yet, so it stays on this browser, scoped to the account that picked it.
interface StoredGoal {
  userId: number
  goal: GoalKey
}

const DAY = 60 * 60 * 24
const TOKEN_OPTS = { default: (): string | null => null, sameSite: 'lax' as const, maxAge: DAY * 30 }
const GOAL_OPTS = { default: (): StoredGoal | null => null, sameSite: 'lax' as const, maxAge: DAY * 365 }

export function useAuth() {
  const token = useCookie<string | null>(TOKEN_COOKIE, TOKEN_OPTS)
  // Shared state keeps every caller in sync at once (separate cookie refs only sync asynchronously); the cookie persists it.
  const goalCookie = useCookie<StoredGoal | null>('humanos_goal', GOAL_OPTS)
  const storedGoal = useState<StoredGoal | null>('auth-goal', () => goalCookie.value)
  // undefined = not loaded yet, null = the API has no profile for this account (404).
  const profileState = useState<Profile | null | undefined>('auth-profile', () => undefined)
  const account = useState<AuthUser | null>('auth-user', () => null)
  const signingOut = useState('auth-signing-out', () => false)

  const profile = computed(() => profileState.value ?? null)
  // A goal picked by another account on this browser is ignored.
  const goal = computed(() =>
    account.value && storedGoal.value?.userId === account.value.id ? storedGoal.value.goal : null,
  )
  const user = computed<User | null>(() => account.value && { ...account.value, profile: profile.value, goal: goal.value })

  const hasToken = computed(() => !!token.value)
  const isAuthenticated = computed(() => !!account.value)
  const profileLoaded = computed(() => profileState.value !== undefined)
  const hasProfile = computed(() => !!profile.value)
  const hasGoal = computed(() => !!goal.value)
  const userName = computed(() => user.value?.name || 'You')
  const firstName = computed(() => userName.value.split(' ')[0])
  const initial = computed(() => userName.value[0]!.toUpperCase())
  const goalLabel = computed(() => goalLabelFor(goal.value ?? undefined))

  function startSession(session: AuthSession) {
    token.value = session.token
    account.value = session.user
    profileState.value = undefined
  }

  function clearSession() {
    token.value = null
    account.value = null
    profileState.value = undefined
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

  /** Loads the profile; null when the account has not saved one yet. */
  async function fetchProfile() {
    profileState.value = await profileService.getProfile()
  }

  async function saveProfile(payload: ProfilePayload) {
    profileState.value = await profileService.saveProfile(payload)
  }

  function setGoal(value: GoalKey) {
    if (!account.value) return
    storedGoal.value = { userId: account.value.id, goal: value }
    goalCookie.value = storedGoal.value
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
      // Reset (not delete) so state owned by Nuxt modules (e.g. DevTools' `__nuxt_devtools__`) keeps a valid value;
      // also drops the loaded profile and weight entries.
      clearNuxtState(key => !['auth-user', 'auth-signing-out', 'theme-preference'].includes(key), { reset: true })
    }
    finally {
      signingOut.value = false
    }
  }

  return {
    user, profile, goal, hasToken, isAuthenticated, profileLoaded, hasProfile, hasGoal, signingOut, userName, firstName, initial, goalLabel,
    login, register, fetchMe, fetchProfile, saveProfile, setGoal, signOut,
  }
}
