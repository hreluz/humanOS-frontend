export function useLoginForm() {
  const { login } = useAuth()
  const route = useRoute()
  const form = reactive({ email: '', password: '' })
  const errors = reactive<{ email?: string, password?: string }>({})
  const formError = ref<string>()
  const showPassword = ref(false)
  const submitting = ref(false)
  // Set by /reset-password after a successful reset.
  const passwordReset = computed(() => route.query.reset === '1')

  watch(() => form.email, () => { errors.email = undefined })
  watch(() => form.password, () => { errors.password = undefined })

  async function submit() {
    errors.email = EMAIL_RE.test(form.email) ? undefined : 'Enter a valid email'
    errors.password = form.password ? undefined : 'Enter your password'
    formError.value = undefined
    if (errors.email || errors.password) return
    submitting.value = true
    try {
      await login(form.email, form.password)
      // The auth middleware sends accounts without a profile to /onboarding.
      await navigateTo('/')
    }
    catch (err) {
      const fields = toFieldErrors(err)
      if (fields) Object.assign(errors, { email: fields.email, password: fields.password })
      else formError.value = toFormMessage(err)
    }
    finally {
      submitting.value = false
    }
  }

  return { form, errors, formError, passwordReset, showPassword, submitting, submit }
}
