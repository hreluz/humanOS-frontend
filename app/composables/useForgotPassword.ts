import * as authService from '~/services/authService'

export function useForgotPassword() {
  const { form, errors, formError, submitting, submit: submitForm } = useForm({ email: '' })
  const email = toRef(form, 'email')
  const error = computed(() => errors.email)
  const sent = ref(false)

  const submit = () => submitForm(
    () => ({ email: EMAIL_RE.test(form.email) ? undefined : 'Enter a valid email' }),
    async () => {
      await authService.forgotPassword(form.email)
      sent.value = true
    },
  )

  const resend = () => { sent.value = false }

  return { email, error, formError, sent, submitting, submit, resend }
}
