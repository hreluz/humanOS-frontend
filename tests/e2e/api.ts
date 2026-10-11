// Direct access to the backend API and Mailpit, for test setup that shouldn't go through the UI.

export const API_BASE = process.env.E2E_API_BASE ?? 'http://localhost:8000/api'
export const MAILPIT_URL = process.env.MAILPIT_URL ?? 'http://localhost:8025'
export const E2E_PASSWORD = 'e2e-password-123'

export interface TestUser {
  id: number
  name: string
  email: string
  password: string
  token: string
}

/** Unique per call, so tests never collide (or share the per-email login throttle). */
export function uniqueEmail(tag: string) {
  return `e2e+${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/** POST JSON to the API, waiting out a 429 (per-IP throttle) once using Retry-After. */
async function post<T>(path: string, body: Record<string, unknown>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.status === 429 && attempt === 0) {
      await sleep((Number(res.headers.get('retry-after')) || 60) * 1000)
      continue
    }
    if (!res.ok) throw new Error(`POST ${path} → ${res.status}: ${await res.text()}`)
    return await res.json() as T
  }
}

export async function registerUser(tag: string, name = 'E2E User'): Promise<TestUser> {
  const email = uniqueEmail(tag)
  const { data } = await post<{ data: { token: string, user: { id: number } } }>('/v1/auth/register', {
    name, email, password: E2E_PASSWORD, password_confirmation: E2E_PASSWORD,
  })
  return { id: data.user.id, name, email, password: E2E_PASSWORD, token: data.token }
}

/** The user registered in global setup (shared by signed-in screenshot tests). */
export function sharedUser(): TestUser {
  const { E2E_USER_ID, E2E_USER_NAME, E2E_USER_EMAIL, E2E_TOKEN } = process.env
  if (!E2E_USER_ID || !E2E_USER_NAME || !E2E_USER_EMAIL || !E2E_TOKEN) throw new Error('Shared e2e user missing — global setup did not run')
  return { id: Number(E2E_USER_ID), name: E2E_USER_NAME, email: E2E_USER_EMAIL, password: E2E_PASSWORD, token: E2E_TOKEN }
}

/**
 * Path + query of the latest password reset link mailed to `email` (e.g. `/reset-password?token=…&email=…`).
 * The mailed host is FRONTEND_URL, so only the path is returned and opened against Playwright's baseURL.
 */
export async function latestResetLink(email: string, timeoutMs = 10_000): Promise<string> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const search = await fetch(`${MAILPIT_URL}/api/v1/search?${new URLSearchParams({ query: `to:"${email}"` })}`)
    const { messages } = await search.json() as { messages: { ID: string }[] }
    if (messages.length) {
      const message = await fetch(`${MAILPIT_URL}/api/v1/message/${messages[0]!.ID}`)
      const { Text, HTML } = await message.json() as { Text: string, HTML: string }
      const match = `${Text}\n${HTML}`.replace(/&amp;/g, '&').match(/\/reset-password\?[^\s"'<>)\]]+/)
      if (match) return match[0]
    }
    await sleep(500)
  }
  throw new Error(`No password reset email for ${email} in Mailpit after ${timeoutMs / 1000}s`)
}

/** Fails fast with a readable message when the backend or Mailpit isn't running. */
export async function assertServicesUp() {
  const checks: [string, string][] = [
    ['Backend API', `${API_BASE}/v1/auth/me`],
    ['Mailpit', `${MAILPIT_URL}/api/v1/info`],
  ]
  for (const [label, url] of checks) {
    try {
      // Any HTTP response (e.g. 401 from /me) means the service is reachable.
      await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(5000) })
    }
    catch {
      throw new Error(`${label} is not reachable at ${url}. Start the backend stack (humanOS-backend: docker compose up -d) or set E2E_API_BASE / MAILPIT_URL.`)
    }
  }
}
