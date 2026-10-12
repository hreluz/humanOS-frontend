import type { components } from '~/types/api.generated'
import type { ActivityLevel, Profile, ProfilePayload, Sex, UnitSystem, WeightEntry } from '~/types/profile'
import { apiStatus } from '~/utils/apiErrors'
import { api } from './api'

// Wire types come from the backend's OpenAPI contract (`pnpm gen:api`); this file maps them to app types.
type Schemas = components['schemas']
type ProfileResource = Schemas['ProfileResource']
type WeightEntryResource = Schemas['WeightEntryResource']

const toProfile = (p: ProfileResource): Profile => ({
  birthDate: p.birth_date,
  age: p.age,
  sex: p.sex as Sex,
  activityLevel: p.activity_level as ActivityLevel,
  unitSystem: p.unit_system as UnitSystem,
  height: p.height,
  weight: p.weight,
  targetWeight: p.target_weight,
  heightCm: p.height_cm,
  weightKg: p.weight_kg,
  targetWeightKg: p.target_weight_kg,
  updatedAt: p.updated_at,
})

const toWeightEntry = (e: WeightEntryResource): WeightEntry => ({ id: e.id, weight: e.weight, weightKg: e.weight_kg, recordedAt: e.recorded_at })

/** The user's profile, or null when they have not saved one yet (404). */
export function getProfile(): Promise<Profile | null> {
  return api<{ data: ProfileResource }>('/v1/profile').then(
    ({ data }) => toProfile(data),
    (err) => {
      if (apiStatus(err) === 404) return null
      throw err
    },
  )
}

export function saveProfile(payload: ProfilePayload): Promise<Profile> {
  return api<{ data: ProfileResource }>('/v1/profile', {
    method: 'PUT',
    body: {
      unit_system: payload.unitSystem,
      birth_date: payload.birthDate,
      sex: payload.sex,
      height: payload.height,
      weight: payload.weight,
      target_weight: payload.targetWeight,
      activity_level: payload.activityLevel,
    } satisfies Schemas['UpdateProfileRequest'],
  }).then(({ data }) => toProfile(data))
}

/** Every recorded weight, newest first. */
export function weightEntries(): Promise<WeightEntry[]> {
  return api<{ data: WeightEntryResource[] }>('/v1/profile/weight-entries').then(({ data }) => data.map(toWeightEntry))
}
