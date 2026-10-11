export function useSignupForm() {
  const { register } = useAuth()
  const { form, errors, formError, submitting, submit: submitForm } = useForm(
    { name: '', email: '', password: '', confirm: '' },
    { password_confirmation: 'confirm' },
  )
  const showPassword = ref(false)

  const submit = () => submitForm(
    () => ({
      name: form.name.trim() ? undefined : 'Enter your name',
      email: EMAIL_RE.test(form.email) ? undefined : 'Enter a valid email',
      password: form.password.length >= 8 ? undefined : 'At least 8 characters',
      confirm: form.confirm === form.password ? undefined : 'Passwords don\'t match',
    }),
    async () => {
      await register({ name: form.name.trim(), email: form.email, password: form.password, passwordConfirmation: form.confirm })
      await navigateTo('/onboarding')
    },
  )

  return { form, errors, formError, showPassword, submitting, submit }
}
