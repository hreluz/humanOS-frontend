interface ApiErrorBody {
  message?: string
  errors?: Record<string, string[]>
}

const GENERIC_MESSAGE = 'Something went wrong. Try again.'

export function apiStatus(err: unknown): number | undefined {
  const e = err as { statusCode?: number, status?: number } | null
  return e?.statusCode ?? e?.status
}

function apiBody(err: unknown): ApiErrorBody | undefined {
  return (err as { data?: ApiErrorBody } | null)?.data
}

const camelCase = (key: string) => key.replace(/_(\w)/g, (_, c: string) => c.toUpperCase())

/**
 * Field → first message from a 422 response, or null for any other error.
 * API keys are camelCased (`password_confirmation` → `passwordConfirmation`) unless `keyMap` renames them.
 */
export function toFieldErrors(err: unknown, keyMap: Record<string, string> = {}): Record<string, string | undefined> | null {
  if (apiStatus(err) !== 422) return null
  const fields: Record<string, string | undefined> = {}
  for (const [key, messages] of Object.entries(apiBody(err)?.errors ?? {})) {
    fields[keyMap[key] ?? camelCase(key)] = messages[0]
  }
  return fields
}

/** Form-level message: the API's message on 429, a generic one for network/5xx errors. */
export function toFormMessage(err: unknown): string {
  if (apiStatus(err) === 429) return apiBody(err)?.message ?? 'Too many attempts. Try again in a minute.'
  return GENERIC_MESSAGE
}
