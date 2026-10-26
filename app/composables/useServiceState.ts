/**
 * Shared, SSR-hydrated state loaded once from a service.
 * `useState` is the store (survives navigation, serialized in the payload);
 * `useAsyncData` only fills it on first use so the server waits for it.
 */
export function useServiceState<T>(key: string, loader: () => Promise<T>) {
  const state = useState<T | null>(key, () => null)
  const { status, error } = useAsyncData(`load:${key}`, async () => {
    if (state.value === null) state.value = await loader()
    return true
  })
  const retrying = ref(false)
  const pending = computed(() => (state.value === null && status.value !== 'error') || retrying.value)

  /** Calls the loader again after a failed load. Never throws: on failure `state` stays `null` and `error` keeps the last error. */
  async function retry() {
    retrying.value = true
    try {
      state.value = await loader()
    }
    catch {
      // Still no data: the caller keeps offering Retry.
    }
    finally {
      retrying.value = false
    }
  }

  return { state, pending, error, retry, retrying }
}
