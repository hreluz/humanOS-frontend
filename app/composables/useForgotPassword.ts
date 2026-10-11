import * as authService from '~/services/authService'

export function useForgotPassword() {
  const email = ref('')
  const error = ref<string>()
  const formError = ref<string>()
  const sent = ref(false)
  const submitting = ref(false)

  watch(email, () => { error.value = undefined })

  async function submit() {
    if (!EMAIL_RE.test(email.value)) {
      error.value = 'Enter a valid email'
      return
    }
    formError.value = undefined
    submitting.value = true
    try {
      await authService.forgotPassword(email.value)
      sent.value = true
    }
    catch (err) {
      const fields = toFieldErrors(err)
      if (fields) error.value = fields.email
      else formError.value = toFormMessage(err)
    }
    finally {
      submitting.value = false
    }
  }

  const resend = () => { sent.value = false }

  return { email, error, formError, sent, submitting, submit, resend }
}
