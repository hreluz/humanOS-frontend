import type { Profile } from '~/types/profile'

export type GoalKey = 'lose' | 'build' | 'maintain' | 'fitness'

export interface OnboardGoal {
  key: GoalKey
  label: string
  hint: string
  icon: string
}

// Account as returned by the API (UserResource), mapped to camelCase in the service.
export interface AuthUser {
  id: number
  name: string
  email: string
  role: string
  emailVerifiedAt: string | null
  createdAt: string | null
}

// What the UI consumes: account + API profile (null until onboarding is done) + the goal kept on this browser.
export interface User extends AuthUser {
  profile: Profile | null
  goal: GoalKey | null
}

export interface AuthSession {
  token: string
  user: AuthUser
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  passwordConfirmation: string
}

export interface ResetPasswordPayload {
  token: string
  email: string
  password: string
  passwordConfirmation: string
}

// Field → first message, built from a 422 `{ message, errors: { field: string[] } }`.
export type FieldErrors = Record<string, string | undefined>
