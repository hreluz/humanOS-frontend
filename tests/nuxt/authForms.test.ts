import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import * as authService from '~/services/authService'

vi.mock('~/services/authService')

const { auth, navigateToMock, route } = vi.hoisted(() => ({
  auth: { login: vi.fn(), register: vi.fn() },
  navigateToMock: vi.fn(),
  route: { query: {} as Record<string, string> },
}))

mockNuxtImport('navigateTo', () => navigateToMock)
mockNuxtImport('useAuth', () => () => auth)
mockNuxtImport('useRoute', () => () => route)

const validation = (errors: Record<string, string[]>) => ({ statusCode: 422, data: { message: 'Invalid.', errors } })
const throttled = { statusCode: 429, data: { message: 'Too Many Attempts.' } }

beforeEach(() => {
  vi.resetAllMocks()
  route.query = {}
})

describe('useLoginForm', () => {
  it('validates on the client before calling the API', async () => {
    const { errors, submit } = useLoginForm()

    await submit()

    expect(errors).toEqual({ email: 'Enter a valid email', password: 'Enter your password' })
    expect(auth.login).not.toHaveBeenCalled()
  })

  it('clears a field error when that field changes', async () => {
    const { form, errors, submit } = useLoginForm()
    await submit()

    form.email = 'ana@example.com'
    await nextTick()

    expect(errors.email).toBeUndefined()
    expect(errors.password).toBe('Enter your password')
  })

  it('logs in and goes home', async () => {
    const { form, submit } = useLoginForm()
    Object.assign(form, { email: 'ana@example.com', password: 'secret-123' })

    await submit()

    expect(auth.login).toHaveBeenCalledWith('ana@example.com', 'secret-123')
    expect(navigateToMock).toHaveBeenCalledWith('/')
  })

  it('puts 422 messages on the fields', async () => {
    auth.login.mockRejectedValue(validation({ email: ['These credentials do not match our records.'] }))
    const { form, errors, formError, submit } = useLoginForm()
    Object.assign(form, { email: 'ana@example.com', password: 'wrong-pass' })

    await submit()

    expect(errors.email).toBe('These credentials do not match our records.')
    expect(formError.value).toBeUndefined()
    expect(navigateToMock).not.toHaveBeenCalled()
  })

  it('flags a just-reset password from ?reset=1', () => {
    route.query = { reset: '1' }
    expect(useLoginForm().passwordReset.value).toBe(true)
  })

  it('shows a 429 as a form-level message', async () => {
    auth.login.mockRejectedValue(throttled)
    const { form, errors, formError, submit } = useLoginForm()
    Object.assign(form, { email: 'ana@example.com', password: 'wrong-pass' })

    await submit()

    expect(formError.value).toBe('Too Many Attempts.')
    expect(errors.email).toBeUndefined()
  })
})

describe('useSignupForm', () => {
  const fill = (form: Record<string, string>) => Object.assign(form, { name: ' Ana Torres ', email: 'ana@example.com', password: 'secret-123', confirm: 'secret-123' })

  it('registers with a trimmed name and goes to onboarding', async () => {
    const { form, submit } = useSignupForm()
    fill(form)

    await submit()

    expect(auth.register).toHaveBeenCalledWith({ name: 'Ana Torres', email: 'ana@example.com', password: 'secret-123', passwordConfirmation: 'secret-123' })
    expect(navigateToMock).toHaveBeenCalledWith('/onboarding')
  })

  it('maps password_confirmation errors onto the confirm field', async () => {
    auth.register.mockRejectedValue(validation({ email: ['The email has already been taken.'], password_confirmation: ['No match.'] }))
    const { form, errors, submit } = useSignupForm()
    fill(form)

    await submit()

    expect(errors.email).toBe('The email has already been taken.')
    expect(errors.confirm).toBe('No match.')
  })
})

describe('useForgotPassword', () => {
  it('shows the sent state on success', async () => {
    vi.mocked(authService.forgotPassword).mockResolvedValue()
    const { email, sent, submit } = useForgotPassword()
    email.value = 'ana@example.com'

    await submit()

    expect(sent.value).toBe(true)
  })

  it('shows a 429 as a form-level message and stays on the form', async () => {
    vi.mocked(authService.forgotPassword).mockRejectedValue(throttled)
    const { email, sent, formError, submit } = useForgotPassword()
    email.value = 'ana@example.com'

    await submit()

    expect(sent.value).toBe(false)
    expect(formError.value).toBe('Too Many Attempts.')
  })
})

describe('useResetPassword', () => {
  const link = { token: 'abc123', email: 'ana@example.com' }

  it('treats a link without token or email as invalid and never calls the API', async () => {
    route.query = { email: 'ana@example.com' }
    const { validLink, form, submit } = useResetPassword()
    Object.assign(form, { password: 'new-secret-1', confirm: 'new-secret-1' })

    await submit()

    expect(validLink).toBe(false)
    expect(authService.resetPassword).not.toHaveBeenCalled()
  })

  it('resets the password and goes to /login?reset=1', async () => {
    route.query = link
    const { email, form, submit } = useResetPassword()
    Object.assign(form, { password: 'new-secret-1', confirm: 'new-secret-1' })

    await submit()

    expect(email).toBe('ana@example.com')
    expect(authService.resetPassword).toHaveBeenCalledWith({ ...link, password: 'new-secret-1', passwordConfirmation: 'new-secret-1' })
    expect(navigateToMock).toHaveBeenCalledWith('/login?reset=1')
  })

  it('shows an invalid token error on the email field', async () => {
    route.query = link
    vi.mocked(authService.resetPassword).mockRejectedValue(validation({ email: ['This password reset token is invalid.'] }))
    const { form, errors, submit } = useResetPassword()
    Object.assign(form, { password: 'new-secret-1', confirm: 'new-secret-1' })

    await submit()

    expect(errors.email).toBe('This password reset token is invalid.')
    expect(navigateToMock).not.toHaveBeenCalled()
  })

  it('shows a token error from the API on the email field', async () => {
    route.query = link
    vi.mocked(authService.resetPassword).mockRejectedValue(validation({ token: ['This password reset token is invalid.'] }))
    const { form, errors, submit } = useResetPassword()
    Object.assign(form, { password: 'new-secret-1', confirm: 'new-secret-1' })

    await submit()

    expect(errors.email).toBe('This password reset token is invalid.')
  })
})
