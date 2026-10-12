import { describe, expect, it } from 'vitest'
import type { ProfileForm } from '~/types/profile'
import { convertProfileForm, profileStatsValid, toPayload, toProfileErrors } from '~/utils/onboarding'

const metricForm = (): ProfileForm => ({
  goal: 'lose', unitSystem: 'metric', birthDate: '1994-04-15', sex: 'male',
  heightCm: '180', heightFt: '', heightIn: '', weight: '82', target: '76', activityLevel: 'moderately_active',
})

describe('convertProfileForm', () => {
  it('converts typed metric values to imperial', () => {
    const form = metricForm()
    convertProfileForm(form, 'imperial')
    expect(form).toMatchObject({ unitSystem: 'imperial', weight: '180.8', target: '167.6', heightFt: '5', heightIn: '11' })
  })

  it('converts typed imperial values back to metric', () => {
    const form = { ...metricForm(), unitSystem: 'imperial' as const, heightCm: '', heightFt: '5', heightIn: '11', weight: '180.8', target: '167.6' }
    convertProfileForm(form, 'metric')
    expect(form).toMatchObject({ unitSystem: 'metric', weight: '82', target: '76', heightCm: '180.3' })
  })

  it('leaves empty fields empty', () => {
    const form = { ...metricForm(), heightCm: '', weight: '', target: '' }
    convertProfileForm(form, 'imperial')
    expect(form).toMatchObject({ unitSystem: 'imperial', weight: '', target: '', heightFt: '', heightIn: '' })
  })

  it('does nothing when the unit system is unchanged', () => {
    const form = metricForm()
    convertProfileForm(form, 'metric')
    expect(form).toEqual(metricForm())
  })
})

describe('profileStatsValid', () => {
  it('accepts a complete form', () => {
    expect(profileStatsValid(metricForm())).toBe(true)
  })

  it.each([
    ['birth date', { birthDate: '' }],
    ['sex', { sex: '' as const }],
    ['height', { heightCm: '' }],
    ['weight', { weight: '0' }],
    ['target for lose', { target: '' }],
  ])('requires %s', (_, patch) => {
    expect(profileStatsValid({ ...metricForm(), ...patch })).toBe(false)
  })

  it('does not require a target for maintain/fitness', () => {
    expect(profileStatsValid({ ...metricForm(), goal: 'maintain', target: '' })).toBe(true)
  })

  it('reads imperial height from ft + in', () => {
    expect(profileStatsValid({ ...metricForm(), unitSystem: 'imperial', heightCm: '', heightFt: '5', heightIn: '' })).toBe(true)
  })
})

describe('toPayload', () => {
  it('sends metric values as numbers', () => {
    expect(toPayload(metricForm())).toEqual({
      unitSystem: 'metric', birthDate: '1994-04-15', sex: 'male', height: 180, weight: 82, targetWeight: 76, activityLevel: 'moderately_active',
    })
  })

  it('sends imperial height as total inches', () => {
    const payload = toPayload({ ...metricForm(), unitSystem: 'imperial', heightFt: '5', heightIn: '11', weight: '180' })
    expect(payload).toMatchObject({ unitSystem: 'imperial', height: 71, weight: 180 })
  })

  it.each(['maintain', 'fitness'] as const)('sends target = weight for %s', (goal) => {
    expect(toPayload({ ...metricForm(), goal, target: '' })).toMatchObject({ weight: 82, targetWeight: 82 })
  })
})

describe('toProfileErrors', () => {
  const unprocessable = (errors: Record<string, string[]>) => ({ statusCode: 422, data: { message: 'Invalid', errors } })

  it('maps API keys to form fields, height by unit system', () => {
    const err = unprocessable({ birth_date: ['Too young'], height: ['Too tall'], target_weight: ['Too low'], activity_level: ['Invalid'], sex: ['Pick one'], weight: ['Too low'] })
    expect(toProfileErrors(err, 'metric')?.fields).toEqual({
      birthDate: 'Too young', heightCm: 'Too tall', target: 'Too low', activityLevel: 'Invalid', sex: 'Pick one', weight: 'Too low',
    })
    expect(toProfileErrors(err, 'imperial')?.fields).toMatchObject({ heightFt: 'Too tall' })
  })

  it('returns unit_system as a form-level message', () => {
    expect(toProfileErrors(unprocessable({ unit_system: ['Bad unit'] }), 'metric')).toEqual({ fields: {}, formError: 'Bad unit' })
  })

  it('returns null for anything but a 422', () => {
    expect(toProfileErrors({ statusCode: 500 }, 'metric')).toBeNull()
  })
})
