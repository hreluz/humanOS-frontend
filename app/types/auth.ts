export type GoalKey = 'lose' | 'build' | 'maintain' | 'fitness'

export type ActivityLevel = 'Sedentary' | 'Light' | 'Moderate' | 'Very active'

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

// Numeric fields stay strings: they come straight from form inputs.
export interface UserProfile {
  goal: GoalKey
  age: string
  height: string
  weight: string
  target: string
  activity: ActivityLevel
}

// What the UI consumes: account + profile (profile is null until onboarding is done).
export interface User extends AuthUser {
  profile: UserProfile | null
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
