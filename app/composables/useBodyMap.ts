import type { BodyView, EquipmentGroupKey, ExerciseDef, ExerciseKind, MuscleKey } from '~/types/training'
import * as trainingService from '~/services/trainingService'

/** Body map state: which side is shown, the picked muscle, equipment group and kind, and the matching list page by page. */
export function useBodyMap() {
  const { viewOf } = useMuscleCatalog()
  const view = ref<BodyView>('front')
  const selected = ref<MuscleKey | null>(null)
  /** One group at a time. It stays picked when the muscle changes. */
  const equipmentGroup = ref<EquipmentGroupKey | null>(null)
  /** Exercises need a muscle and a group; stretches only need a muscle. The muscle and group stay when this changes. */
  const kind = ref<ExerciseKind>('exercises')
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

  // Only the latest muscle, group and kind may change the list, so fast taps never show a stale result.
  let request = 0
  let page = 1

  /** Requests a page of the current list, or returns null while the list is still missing a muscle or a group. */
  function requestPage(number: number) {
    const muscle = selected.value
    const group = equipmentGroup.value
    if (!muscle) return null
    if (kind.value === 'stretches') return trainingService.getStretches(muscle, number)
    return group ? trainingService.getExercises(muscle, group, number) : null
  }

  /** Starts the list over. The old cards are cleared, because they'd sit under the new muscle's headings. */
  async function loadFirstPage() {
    const id = ++request
    page = 1
    exercises.value = []
    failed.value = false
    hasMore.value = false
    loadingMore.value = false
    loadMoreFailed.value = false
    const pending = requestPage(1)
    loading.value = !!pending
    if (!pending) return
    try {
      const result = await pending
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

  watch([selected, equipmentGroup, kind], loadFirstPage)

  /** Appends the next page. After a failure the list stays, and the next try asks for the same page. */
  async function loadMore() {
    if (loadingMore.value || !hasMore.value) return
    const pending = requestPage(page + 1)
    if (!pending) return
    const id = request
    loadingMore.value = true
    loadMoreFailed.value = false
    try {
      const result = await pending
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
    kind,
    exercises, loading, failed, retry: loadFirstPage,
    hasMore, loadingMore, loadMoreFailed, loadMore,
  }
}
