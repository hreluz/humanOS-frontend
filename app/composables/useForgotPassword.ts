import * as authService from '~/services/authService'

export function useForgotPassword() {
  const email = ref('')
  const error = ref<string>()
  const sent = ref(false)
  const submitting = ref(false)

  watch(email, () => { error.value = undefined })

  async function submit() {
    if (!EMAIL_RE.test(email.value)) {
      error.value = 'Enter a valid email'
      return
    }
    submitting.value = true
    try {
      await authService.requestPasswordReset(email.value)
      sent.value = true
    }
    finally {
      submitting.value = false
    }
  }

  const resend = () => { sent.value = false }

  return { email, error, sent, submitting, submit, resend }
}
