export function useLoginForm() {
  const { signIn } = useAuth()
  const form = reactive({ email: '', password: '' })
  const errors = reactive<{ email?: string, password?: string }>({})
  const showPassword = ref(false)
  const submitting = ref(false)

  watch(() => form.email, () => { errors.email = undefined })
  watch(() => form.password, () => { errors.password = undefined })

  async function submit() {
    errors.email = EMAIL_RE.test(form.email) ? undefined : 'Enter a valid email'
    errors.password = form.password ? undefined : 'Enter your password'
    if (errors.email || errors.password) return
    submitting.value = true
    try {
      await signIn(form.email, form.password)
      await navigateTo('/')
    }
    finally {
      submitting.value = false
    }
  }

  return { form, errors, showPassword, submitting, submit }
}
