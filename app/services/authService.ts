import type { components } from '~/types/api.generated'
import type { AuthSession, AuthUser, RegisterPayload, ResetPasswordPayload, UserProfile } from '~/types/auth'
import { api } from './api'
import { delay } from './mocks/delay'

// Wire types come from the backend's OpenAPI contract (`pnpm gen:api`); this file maps them to app types.
type Schemas = components['schemas']
type UserResource = Schemas['UserResource']
type AuthTokenResource = Schemas['AuthTokenResource']

const toAuthUser = (u: UserResource): AuthUser => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  emailVerifiedAt: u.email_verified_at,
  createdAt: u.created_at,
})

const toSession = ({ data }: { data: AuthTokenResource }): AuthSession => ({ token: data.token, user: toAuthUser(data.user) })

export function register(payload: RegisterPayload): Promise<AuthSession> {
  return api<{ data: AuthTokenResource }>('/v1/auth/register', {
    method: 'POST',
    body: { name: payload.name, email: payload.email, password: payload.password, password_confirmation: payload.passwordConfirmation } satisfies Schemas['RegisterRequest'],
  }).then(toSession)
}

export function login(email: string, password: string): Promise<AuthSession> {
  return api<{ data: AuthTokenResource }>('/v1/auth/login', { method: 'POST', body: { email, password } satisfies Schemas['LoginRequest'] }).then(toSession)
}

export function logout(): Promise<void> {
  return api<undefined>('/v1/auth/logout', { method: 'POST' }).then(() => {})
}

export function me(): Promise<AuthUser> {
  return api<{ data: UserResource }>('/v1/auth/me').then(({ data }) => toAuthUser(data))
}

export function forgotPassword(email: string): Promise<void> {
  return api<{ message: string }>('/v1/auth/forgot-password', { method: 'POST', body: { email } satisfies Schemas['ForgotPasswordRequest'] }).then(() => {})
}

export function resetPassword(payload: ResetPasswordPayload): Promise<void> {
  return api<{ message: string }>('/v1/auth/reset-password', {
    method: 'POST',
    body: { token: payload.token, email: payload.email, password: payload.password, password_confirmation: payload.passwordConfirmation } satisfies Schemas['ResetPasswordRequest'],
  }).then(() => {})
}

// No profile API yet: the hook persists the profile locally. Swap for an api() call once it exists.
export async function saveProfile(profile: UserProfile): Promise<UserProfile> {
  await delay()
  return profile
}
