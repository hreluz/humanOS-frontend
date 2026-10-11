const AUTH_ROUTES = ['/login', '/signup', '/forgot-password', '/onboarding']

export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated } = useAuth()
  const isAuthRoute = AUTH_ROUTES.includes(to.path)

  if (!isAuthenticated.value && !isAuthRoute) return navigateTo('/login')
  if (isAuthenticated.value && isAuthRoute) return navigateTo('/')
  // Onboarding continues a signup in progress; without one, start over.
  if (to.path === '/onboarding' && !useSignupDraft().value) return navigateTo('/signup')
})
