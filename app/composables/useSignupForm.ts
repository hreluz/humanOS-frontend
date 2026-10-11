import * as authService from '~/services/authService'

export function useSignupForm() {
  const draft = useSignupDraft()
  const form = reactive({ name: '', email: '', password: '', confirm: '' })
  const errors = reactive<{ name?: string, email?: string, password?: string, confirm?: string }>({})
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
    if (Object.values(errors).some(Boolean)) return
    submitting.value = true
    try {
      draft.value = await authService.signUp({ name: form.name, email: form.email, password: form.password })
      await navigateTo('/onboarding')
    }
    finally {
      submitting.value = false
    }
  }

  return { form, errors, showPassword, submitting, submit }
}
