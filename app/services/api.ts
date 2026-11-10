export const TOKEN_COOKIE = 'humanos_token'

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: Record<string, unknown>
  query?: Record<string, string | number | string[]>
}

/**
 * $fetch against the backend API, with the bearer token from the `humanos_token` cookie.
 * Call it synchronously from a service so the Nuxt context (cookie, runtime config) is available on SSR.
 */
export function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const token = useCookie<string | null>(TOKEN_COOKIE, { readonly: true }).value
  return $fetch<T>(path, {
    ...options,
    baseURL: useRuntimeConfig().public.apiBase,
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
}
