const AUTH_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password']

export default defineNuxtRouteMiddleware(async (to) => {
  const { hasToken, isAuthenticated, profileLoaded, hasProfile, hasGoal, fetchMe, fetchProfile } = useAuth()

  // Restore the account from the token (first SSR render, or after a reload).
  if (hasToken.value && !isAuthenticated.value) await fetchMe()

  if (!isAuthenticated.value) {
    if (!AUTH_ROUTES.includes(to.path)) return navigateTo('/login')
    return
  }
  // The onboarding gate needs the profile on first paint; it is loaded once per session.
  if (!profileLoaded.value) await fetchProfile()

  // No API profile, or no goal picked on this browser: onboarding first (goal-only when the profile exists).
  if (!hasProfile.value || !hasGoal.value) {
    if (to.path !== '/onboarding') return navigateTo('/onboarding')
    return
  }
  if (AUTH_ROUTES.includes(to.path) || to.path === '/onboarding') return navigateTo('/')
})
