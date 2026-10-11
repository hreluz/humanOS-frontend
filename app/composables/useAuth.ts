import type { SignupDraft, User, UserProfile } from '~/types/auth'
import * as authService from '~/services/authService'

const COOKIE_OPTS = { default: (): User | null => null, sameSite: 'lax' as const, maxAge: 60 * 60 * 24 * 30 }

export function useAuth() {
  const cookie = useCookie<User | null>('humanos_user', COOKIE_OPTS)
  const user = useState<User | null>('auth-user', () => cookie.value ?? null)

  function setUser(value: User | null) {
    user.value = value
    cookie.value = value
  }

  const isAuthenticated = computed(() => !!user.value)
  const userName = computed(() => user.value?.name || 'You')
  const firstName = computed(() => userName.value.split(' ')[0])
  const initial = computed(() => userName.value[0]!.toUpperCase())
  const goalLabel = computed(() => goalLabelFor(user.value?.goal))

  async function signIn(email: string, password: string) {
    setUser(await authService.signIn(email, password))
  }

  async function completeOnboarding(draft: SignupDraft, profile: UserProfile) {
    setUser(await authService.completeOnboarding(draft, profile))
  }

  async function signOut() {
    await authService.signOut()
    setUser(null)
    await navigateTo('/login')
    clearNuxtState(key => key !== 'auth-user' && key !== 'theme-preference')
  }

  return { user, isAuthenticated, userName, firstName, initial, goalLabel, signIn, completeOnboarding, signOut }
}

export function useSignupDraft() {
  return useState<SignupDraft | null>('signup-draft', () => null)
}
