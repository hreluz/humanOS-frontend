import { describe, expect, it } from 'vitest'
import { apiStatus, toFieldErrors, toFormMessage } from '~/utils/apiErrors'

const apiError = (statusCode: number, data?: unknown) => ({ statusCode, data })

describe('apiStatus', () => {
  it('reads statusCode, then status', () => {
    expect(apiStatus({ statusCode: 422 })).toBe(422)
    expect(apiStatus({ status: 401 })).toBe(401)
    expect(apiStatus(null)).toBeUndefined()
  })
})

describe('toFieldErrors', () => {
  it('returns null for anything but a 422', () => {
    expect(toFieldErrors(apiError(429, { message: 'Too Many Attempts.' }))).toBeNull()
    expect(toFieldErrors(new TypeError('fetch failed'))).toBeNull()
  })

  it('keeps the first message per field and camelCases keys', () => {
    const err = apiError(422, { message: 'Invalid', errors: { email: ['Taken.', 'Other.'], password_confirmation: ['No match.'] } })
    expect(toFieldErrors(err)).toEqual({ email: 'Taken.', passwordConfirmation: 'No match.' })
  })

  it('renames keys through keyMap', () => {
    const err = apiError(422, { errors: { password_confirmation: ['No match.'] } })
    expect(toFieldErrors(err, { password_confirmation: 'confirm' })).toEqual({ confirm: 'No match.' })
  })
})

describe('toFormMessage', () => {
  it('uses the API message on 429', () => {
    expect(toFormMessage(apiError(429, { message: 'Too Many Attempts.' }))).toBe('Too Many Attempts.')
  })

  it('falls back to a generic message', () => {
    expect(toFormMessage(apiError(429))).toBe('Too many attempts. Try again in a minute.')
    expect(toFormMessage(apiError(500))).toBe('Something went wrong. Try again.')
    expect(toFormMessage(new TypeError('fetch failed'))).toBe('Something went wrong. Try again.')
  })
})
