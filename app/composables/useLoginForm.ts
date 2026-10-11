export function useLoginForm() {
  const { login } = useAuth()
  const route = useRoute()
  const { form, errors, formError, submitting, submit: submitForm } = useForm({ email: '', password: '' })
  const showPassword = ref(false)
  // Set by /reset-password after a successful reset.
  const passwordReset = computed(() => route.query.reset === '1')

  const submit = () => submitForm(
    () => ({
      email: EMAIL_RE.test(form.email) ? undefined : 'Enter a valid email',
      password: form.password ? undefined : 'Enter your password',
    }),
    async () => {
      await login(form.email, form.password)
      // The auth middleware sends accounts without a profile to /onboarding.
      await navigateTo('/')
    },
  )

  return { form, errors, formError, passwordReset, showPassword, submitting, submit }
}
