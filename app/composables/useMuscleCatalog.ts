import type { BodyView, MuscleKey } from '~/types/training'
import * as trainingService from '~/services/trainingService'

/** The muscle catalog from the API: areas and muscles in display order, labels and sides. Loaded once per session. */
export function useMuscleCatalog() {
  const { state, pending: loading, error } = useServiceState('muscle-areas', trainingService.getMuscleAreas)
  const retrying = ref(false)

  const areas = computed(() => state.value ?? [])
  const muscles = computed(() => areas.value.flatMap(a => a.muscles))
  const labels = computed(() => Object.fromEntries(muscles.value.map(m => [m.key, m.label])) as Partial<Record<MuscleKey, string>>)

  const pending = computed(() => loading.value || retrying.value)
  const failed = computed(() => state.value === null && !!error.value && !retrying.value)

  /** The API label, or `''` before the catalog loads. */
  const label = (key: MuscleKey) => labels.value[key] ?? ''
  const viewOf = (key: MuscleKey): BodyView | undefined => muscles.value.find(m => m.key === key)?.view

  async function retry() {
    retrying.value = true
    try {
      state.value = await trainingService.getMuscleAreas()
    }
    catch {
      // Still no data: `failed` stays true and the page keeps offering Retry.
    }
    finally {
      retrying.value = false
    }
  }

  return { areas, labels, label, viewOf, pending, failed, retry }
}
