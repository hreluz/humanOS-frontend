import type { BodyView, EquipmentGroupKey, ExerciseDef, MuscleKey } from '~/types/training'
import * as trainingService from '~/services/trainingService'

/** Body map state: which side is shown, the picked muscle and equipment group, and the matching exercises page by page. */
export function useBodyMap() {
  const { viewOf } = useMuscleCatalog()
  const view = ref<BodyView>('front')
  const selected = ref<MuscleKey | null>(null)
  /** One group at a time. It stays picked when the muscle changes. */
  const equipmentGroup = ref<EquipmentGroupKey | null>(null)
  const exercises = ref<ExerciseDef[]>([])
  const loading = ref(false)
  const failed = ref(false)
  const hasMore = ref(false)
  const loadingMore = ref(false)
  const loadMoreFailed = ref(false)

  /**
   * Picks a muscle. If it isn't drawn on the side being shown, the figure turns to the muscle's side from the catalog,
   * or to whichever side draws it.
   */
  function select(muscle: MuscleKey) {
    selected.value = muscle
    if (isOnView(muscle, view.value)) return
    const side = viewOf(muscle)
    view.value = side && isOnView(muscle, side) ? side : view.value === 'front' ? 'back' : 'front'
  }

  function pickEquipment(key: EquipmentGroupKey) {
    equipmentGroup.value = key
  }

  // Only the latest muscle and group may change the list, so fast taps never show a stale result.
  let request = 0
  let page = 1

  /** Starts the list over. The old cards are cleared, because they'd sit under the new muscle's headings. */
  async function loadFirstPage() {
    const id = ++request
    const muscle = selected.value
    const group = equipmentGroup.value
    page = 1
    exercises.value = []
    failed.value = false
    hasMore.value = false
    loadingMore.value = false
    loadMoreFailed.value = false
    loading.value = !!muscle && !!group
    if (!muscle || !group) return
    try {
      const result = await trainingService.getExercises(muscle, group)
      if (id !== request) return
      exercises.value = result.items
      hasMore.value = result.hasMore
    }
    catch {
      if (id === request) failed.value = true
    }
    finally {
      if (id === request) loading.value = false
    }
  }

  watch([selected, equipmentGroup], loadFirstPage)

  /** Appends the next page. After a failure the list stays, and the next try asks for the same page. */
  async function loadMore() {
    const muscle = selected.value
    const group = equipmentGroup.value
    if (!muscle || !group || loadingMore.value || !hasMore.value) return
    const id = request
    loadingMore.value = true
    loadMoreFailed.value = false
    try {
      const result = await trainingService.getExercises(muscle, group, page + 1)
      if (id !== request) return
      page++
      exercises.value = [...exercises.value, ...result.items]
      hasMore.value = result.hasMore
    }
    catch {
      if (id === request) loadMoreFailed.value = true
    }
    finally {
      if (id === request) loadingMore.value = false
    }
  }

  return {
    view, selected, select,
    equipmentGroup, pickEquipment,
    exercises, loading, failed, retry: loadFirstPage,
    hasMore, loadingMore, loadMoreFailed, loadMore,
  }
}
