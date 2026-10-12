import type { FieldErrors, GoalKey, OnboardGoal } from '~/types/auth'
import type { ActivityLevel, ProfileForm, ProfilePayload, Sex, UnitSystem } from '~/types/profile'

export const ONBOARD_GOALS: OnboardGoal[] = [
  { key: 'lose', label: 'Lose fat', hint: 'Calorie deficit, keep muscle', icon: 'M4 12h4l2-7 4 14 2-7h4' },
  { key: 'build', label: 'Build muscle', hint: 'Small surplus, high protein', icon: 'M4 12h4m8 0h4M8 8v8m8-8v8' },
  { key: 'maintain', label: 'Maintain', hint: 'Hold weight, eat well', icon: 'M5 12h14' },
  { key: 'fitness', label: 'Get fitter', hint: 'Endurance, steps, sleep', icon: 'M13 3l-8 11h6l-1 7 8-11h-6l1-7z' },
]

export const ACTIVITY_LEVELS: { value: ActivityLevel, label: string, hint: string }[] = [
  { value: 'sedentary', label: 'Sedentary', hint: 'Desk job, little exercise' },
  { value: 'lightly_active', label: 'Light', hint: 'Exercise 1–3 days a week' },
  { value: 'moderately_active', label: 'Moderate', hint: 'Exercise 3–5 days a week' },
  { value: 'very_active', label: 'Very active', hint: 'Hard exercise 6–7 days a week' },
  { value: 'extra_active', label: 'Extra active', hint: 'Physical job or training twice a day' },
]

export function goalLabelFor(key: GoalKey | undefined) {
  return (ONBOARD_GOALS.find(g => g.key === key) ?? ONBOARD_GOALS[0]!).label
}

/** Lose/build goals need a target weight. */
export function goalNeedsTarget(key: GoalKey) {
  return key === 'lose' || key === 'build'
}

const heightOf = (form: ProfileForm) =>
  form.unitSystem === 'imperial' ? ftInToInches(+form.heightFt, +form.heightIn) : +form.heightCm

/**
 * Fields still needed before the form can be sent, in form order (e.g. `['birth date', 'sex']`).
 * Birth date, sex, height and weight are required; target weight only for goals that need one. Ranges are checked by the API.
 */
export function missingProfileFields(form: ProfileForm) {
  const missing: string[] = []
  if (!form.birthDate) missing.push('birth date')
  if (!form.sex) missing.push('sex')
  if (!(heightOf(form) > 0)) missing.push('height')
  if (!(+form.weight > 0)) missing.push('weight')
  if (goalNeedsTarget(form.goal) && !(+form.target > 0)) missing.push('target weight')
  return missing
}

export function profileStatsValid(form: ProfileForm) {
  return missingProfileFields(form).length === 0
}

/** ['birth date', 'sex'] → "Add your birth date and sex to continue." */
export function missingFieldsHint(missing: string[]) {
  if (!missing.length) return ''
  const list = missing.length === 1 ? missing[0] : `${missing.slice(0, -1).join(', ')} and ${missing.at(-1)}`
  return `Add your ${list} to continue.`
}

/** Form → PUT /v1/profile body. Imperial height is total inches; goals without a target send the current weight as target. */
export function toPayload(form: ProfileForm): ProfilePayload {
  const weight = +form.weight
  return {
    unitSystem: form.unitSystem,
    birthDate: form.birthDate,
    sex: form.sex as Sex,
    height: heightOf(form),
    weight,
    targetWeight: goalNeedsTarget(form.goal) ? +form.target : weight,
    activityLevel: form.activityLevel,
  }
}

/**
 * A 422 from PUT /v1/profile as form field errors (height lands on the field the unit system shows),
 * with `unit_system` as a form-level message. Null for any other error.
 */
export function toProfileErrors(err: unknown, unitSystem: UnitSystem): { fields: FieldErrors, formError?: string } | null {
  const fields = toFieldErrors(err, {
    birth_date: 'birthDate',
    height: unitSystem === 'imperial' ? 'heightFt' : 'heightCm',
    target_weight: 'target',
    activity_level: 'activityLevel',
  })
  if (!fields) return null
  const { unitSystem: formError, ...rest } = fields
  return { fields: rest, formError }
}

const convert = (value: string, fn: (n: number) => number) => (value === '' ? '' : String(fn(+value)))

/** Switches the form to `to`, converting the values already typed (kg ↔ lb, cm ↔ ft + in). Empty fields stay empty. */
export function convertProfileForm(form: ProfileForm, to: UnitSystem) {
  if (form.unitSystem === to) return
  if (to === 'imperial') {
    form.weight = convert(form.weight, kgToLb)
    form.target = convert(form.target, kgToLb)
    if (form.heightCm !== '') {
      const { ft, in: inches } = cmToFtIn(+form.heightCm)
      form.heightFt = String(ft)
      form.heightIn = String(inches)
    }
  }
  else {
    form.weight = convert(form.weight, lbToKg)
    form.target = convert(form.target, lbToKg)
    if (form.heightFt !== '' || form.heightIn !== '') form.heightCm = String(inchesToCm(ftInToInches(+form.heightFt, +form.heightIn)))
  }
  form.unitSystem = to
}
