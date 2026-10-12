import type { GoalKey } from '~/types/auth'

// Wire types come from api.generated.ts; these are the app (camelCase) types.
export type Sex = 'male' | 'female'
export type UnitSystem = 'metric' | 'imperial'
export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active'

// ProfileResource. height/weight/targetWeight are in unitSystem units (inches, lb when imperial).
export interface Profile {
  birthDate: string // YYYY-MM-DD
  age: number
  sex: Sex
  activityLevel: ActivityLevel
  unitSystem: UnitSystem
  height: number
  weight: number | null
  targetWeight: number | null
  heightCm: number
  weightKg: number | null
  targetWeightKg: number | null
  updatedAt: string | null
}

// UpdateProfileRequest. height is cm (metric) or total inches (imperial).
export interface ProfilePayload {
  unitSystem: UnitSystem
  birthDate: string
  sex: Sex
  height: number
  weight: number
  targetWeight: number
  activityLevel: ActivityLevel
}

// WeightEntryResource.
export interface WeightEntry { id: number, weight: number, weightKg: number, recordedAt: string }

// Onboarding and Edit profile form. Numeric fields stay strings: they come straight from form inputs.
export interface ProfileForm {
  goal: GoalKey
  unitSystem: UnitSystem
  birthDate: string
  sex: Sex | ''
  heightCm: string // metric
  heightFt: string // imperial
  heightIn: string // imperial
  weight: string // kg or lb
  target: string // kg or lb; hidden for maintain/fitness
  activityLevel: ActivityLevel
}
