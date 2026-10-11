export function useSignupForm() {
  const { register } = useAuth()
  const form = reactive({ name: '', email: '', password: '', confirm: '' })
  const errors = reactive<{ name?: string, email?: string, password?: string, confirm?: string }>({})
  const formError = ref<string>()
  const showPassword = ref(false)
  const submitting = ref(false)

  for (const field of ['name', 'email', 'password', 'confirm'] as const) {
    watch(() => form[field], () => { errors[field] = undefined })
  }

  async function submit() {
    errors.name = form.name.trim() ? undefined : 'Enter your name'
    errors.email = EMAIL_RE.test(form.email) ? undefined : 'Enter a valid email'
    errors.password = form.password.length >= 8 ? undefined : 'At least 8 characters'
    errors.confirm = form.confirm === form.password ? undefined : 'Passwords don\'t match'
    formError.value = undefined
    if (Object.values(errors).some(Boolean)) return
    submitting.value = true
    try {
      await register({ name: form.name.trim(), email: form.email, password: form.password, passwordConfirmation: form.confirm })
      await navigateTo('/onboarding')
    }
    catch (err) {
      const fields = toFieldErrors(err, { password_confirmation: 'confirm' })
      if (fields) Object.assign(errors, { name: fields.name, email: fields.email, password: fields.password, confirm: fields.confirm })
      else formError.value = toFormMessage(err)
    }
    finally {
      submitting.value = false
    }
  }

  return { form, errors, formError, showPassword, submitting, submit }
}
