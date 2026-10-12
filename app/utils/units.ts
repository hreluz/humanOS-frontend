import type { Profile, UnitSystem } from '~/types/profile'

// Same factors as the backend.
const CM_PER_IN = 2.54
const KG_PER_LB = 0.45359237

const round1 = (n: number) => Math.round(n * 10) / 10

/** 82 → 180.8 (1 decimal). */
export const kgToLb = (kg: number) => round1(kg / KG_PER_LB)

/** 180.8 → 82 (1 decimal). */
export const lbToKg = (lb: number) => round1(lb * KG_PER_LB)

/** 71 → { ft: 5, in: 11 }. Inches are rounded to a whole number first. */
export function inchesToFtIn(inches: number) {
  const total = Math.round(inches)
  return { ft: Math.floor(total / 12), in: total % 12 }
}

/** 180 → { ft: 5, in: 11 }. */
export const cmToFtIn = (cm: number) => inchesToFtIn(cm / CM_PER_IN)

/** 5, 11 → 71. */
export const ftInToInches = (ft: number, inches: number) => ft * 12 + inches

/** 71 → 180.3 (1 decimal). */
export const inchesToCm = (inches: number) => round1(inches * CM_PER_IN)

export const weightUnit = (unitSystem: UnitSystem): 'kg' | 'lb' => (unitSystem === 'imperial' ? 'lb' : 'kg')

/** "180 cm" (metric) or "5′ 11″" (imperial, from total inches). */
export function formatHeight(profile: Pick<Profile, 'unitSystem' | 'height'>) {
  if (profile.unitSystem === 'metric') return `${profile.height} cm`
  const { ft, in: inches } = inchesToFtIn(profile.height)
  return `${ft}′ ${inches}″`
}
