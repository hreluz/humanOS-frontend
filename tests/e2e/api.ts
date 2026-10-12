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

/** PUT /v1/profile body (snake_case, as the API reads it). */
export interface ProfileBody {
  unit_system: 'metric' | 'imperial'
  birth_date: string
  sex: 'male' | 'female'
  height: number
  weight: number
  target_weight: number
  activity_level: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active'
}

/** The shared user's profile (goal `lose` is set per browser by helpers.signIn). */
export const METRIC_PROFILE: ProfileBody = {
  unit_system: 'metric', birth_date: '1994-04-15', sex: 'male', height: 180, weight: 82.1, target_weight: 76, activity_level: 'moderately_active',
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/** Sends JSON to the API, waiting out a 429 (per-IP throttle) once using Retry-After. */
async function send<T>(method: 'POST' | 'PUT', path: string, body: object, token?: string): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    })
    if (res.status === 429 && attempt === 0) {
      await sleep((Number(res.headers.get('retry-after')) || 60) * 1000)
      continue
    }
    if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${await res.text()}`)
    return await res.json() as T
  }
}

const post = <T>(path: string, body: object) => send<T>('POST', path, body)

export async function registerUser(tag: string, name = 'E2E User'): Promise<TestUser> {
  const email = uniqueEmail(tag)
  const { data } = await post<{ data: { token: string, user: { id: number } } }>('/v1/auth/register', {
    name, email, password: E2E_PASSWORD, password_confirmation: E2E_PASSWORD,
  })
  return { id: data.user.id, name, email, password: E2E_PASSWORD, token: data.token }
}

/** Saves `user`'s profile through the API (PUT /v1/profile), as onboarding would. */
export async function saveProfile(user: TestUser, body: ProfileBody) {
  await send('PUT', '/v1/profile', body, user.token)
}

/** Passes a user registered in global setup to the workers through env vars. */
export function exportUser(prefix: string, user: TestUser) {
  process.env[`${prefix}_ID`] = String(user.id)
  process.env[`${prefix}_NAME`] = user.name
  process.env[`${prefix}_EMAIL`] = user.email
  process.env[`${prefix}_TOKEN`] = user.token
}

function importUser(prefix: string): TestUser {
  const [id, name, email, token] = ['ID', 'NAME', 'EMAIL', 'TOKEN'].map(k => process.env[`${prefix}_${k}`])
  if (!id || !name || !email || !token) throw new Error(`${prefix} e2e user missing — global setup did not run`)
  return { id: Number(id), name, email, password: E2E_PASSWORD, token }
}

/** The user registered in global setup with METRIC_PROFILE (shared by signed-in screenshot tests). Never mutate its profile. */
export const sharedUser = () => importUser('E2E_USER')

/** A user registered in global setup without a profile, for onboarding screens. Never complete onboarding with it. */
export const newUser = () => importUser('E2E_NEW_USER')

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
