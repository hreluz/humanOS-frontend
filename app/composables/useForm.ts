/**
 * Form state shared by the auth forms: field values, per-field errors (cleared when the field changes),
 * a form-level error and the submitting flag. `submit` runs client validation, then the action, and maps
 * API errors: 422 messages onto fields (via `keyMap`, e.g. `password_confirmation` → `confirm`), anything else to `formError`.
 *
 * `E` adds error keys that aren't form fields (e.g. `email` on the reset form, which comes from the link).
 */
export function useForm<F extends Record<string, string>, E extends string = never>(
  initial: F,
  keyMap: Record<string, Extract<keyof F, string> | E> = {},
) {
  type Key = Extract<keyof F, string> | E
  type Errors = Partial<Record<Key, string>>

  const form = reactive({ ...initial }) as F
  const errors = reactive<Errors>({}) as Errors
  const formError = ref<string>()
  const submitting = ref(false)

  for (const key of Object.keys(initial) as Key[]) {
    watch(() => form[key as keyof F], () => { errors[key] = undefined })
  }

  async function submit(validate: () => Errors, action: () => Promise<unknown>) {
    for (const key of Object.keys(errors) as Key[]) errors[key] = undefined
    formError.value = undefined
    const invalid = validate()
    Object.assign(errors, invalid)
    if (Object.values(invalid).some(Boolean)) return

    submitting.value = true
    try {
      await action()
    }
    catch (err) {
      const fields = toFieldErrors(err, keyMap)
      if (!fields) formError.value = toFormMessage(err)
      // First message wins when two API keys map to the same field (e.g. `token` and `email`).
      else for (const [key, message] of Object.entries(fields)) errors[key as Key] ??= message
    }
    finally {
      submitting.value = false
    }
  }

  return { form, errors, formError, submitting, submit }
}
