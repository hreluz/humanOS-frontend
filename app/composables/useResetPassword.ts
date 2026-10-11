import * as authService from '~/services/authService'

export function useResetPassword() {
  const route = useRoute()
  // From the emailed link: /reset-password?token=…&email=…
  const token = typeof route.query.token === 'string' ? route.query.token : ''
  const email = typeof route.query.email === 'string' ? route.query.email : ''
  const validLink = !!token && !!email

  // An invalid or expired token comes back as an error on `email`, which is shown under the read-only email field.
  const { form, errors, formError, submitting, submit: submitForm } = useForm<{ password: string, confirm: string }, 'email'>(
    { password: '', confirm: '' },
    { password_confirmation: 'confirm', token: 'email' },
  )
  const showPassword = ref(false)

  async function submit() {
    if (!validLink) return
    await submitForm(
      () => ({
        password: form.password.length >= 8 ? undefined : 'At least 8 characters',
        confirm: form.confirm === form.password ? undefined : 'Passwords don\'t match',
      }),
      async () => {
        await authService.resetPassword({ token, email, password: form.password, passwordConfirmation: form.confirm })
        await navigateTo('/login?reset=1')
      },
    )
  }

  return { email, validLink, form, errors, formError, showPassword, submitting, submit }
}
