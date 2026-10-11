const AUTH_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password']

export default defineNuxtRouteMiddleware(async (to) => {
  const { hasToken, isAuthenticated, hasProfile, fetchMe } = useAuth()

  // Restore the account from the token (first SSR render, or after a reload).
  if (hasToken.value && !isAuthenticated.value) await fetchMe()

  if (!isAuthenticated.value) {
    if (!AUTH_ROUTES.includes(to.path)) return navigateTo('/login')
    return
  }
  // Signed in without a profile on this browser: onboarding first.
  if (!hasProfile.value) {
    if (to.path !== '/onboarding') return navigateTo('/onboarding')
    return
  }
  if (AUTH_ROUTES.includes(to.path) || to.path === '/onboarding') return navigateTo('/')
})
