import * as authService from '~/services/authService'

export function useResetPassword() {
  const route = useRoute()
  // From the emailed link: /reset-password?token=…&email=…
  const token = typeof route.query.token === 'string' ? route.query.token : ''
  const email = typeof route.query.email === 'string' ? route.query.email : ''
  const validLink = !!token && !!email

  const form = reactive({ password: '', confirm: '' })
  const errors = reactive<{ email?: string, password?: string, confirm?: string }>({})
  const formError = ref<string>()
  const showPassword = ref(false)
  const submitting = ref(false)

  watch(() => form.password, () => { errors.password = undefined })
  watch(() => form.confirm, () => { errors.confirm = undefined })

  async function submit() {
    errors.password = form.password.length >= 8 ? undefined : 'At least 8 characters'
    errors.confirm = form.confirm === form.password ? undefined : 'Passwords don\'t match'
    errors.email = undefined
    formError.value = undefined
    if (!validLink || errors.password || errors.confirm) return
    submitting.value = true
    try {
      await authService.resetPassword({ token, email, password: form.password, passwordConfirmation: form.confirm })
      await navigateTo('/login?reset=1')
    }
    catch (err) {
      // An invalid or expired token comes back as an error on `email`.
      const fields = toFieldErrors(err, { password_confirmation: 'confirm' })
      if (fields) Object.assign(errors, { email: fields.email ?? fields.token, password: fields.password, confirm: fields.confirm })
      else formError.value = toFormMessage(err)
    }
    finally {
      submitting.value = false
    }
  }

  return { email, validLink, form, errors, formError, showPassword, submitting, submit }
}
