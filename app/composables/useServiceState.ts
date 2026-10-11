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
  const pending = computed(() => state.value === null && status.value !== 'error')
  return { state, pending, error }
}
