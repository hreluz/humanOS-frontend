import type { BodyView, EquipmentGroupKey, ExerciseDef, MuscleKey } from '~/types/training'
import * as trainingService from '~/services/trainingService'

/** Body map state: which side is shown, the picked muscle, the equipment filter and the matching exercises. */
export function useBodyMap() {
  const { viewOf } = useMuscleCatalog()
  const { groups, pending: equipmentPending, failed: equipmentFailed } = useEquipmentCatalog()
  const view = ref<BodyView>('front')
  const selected = ref<MuscleKey | null>(null)
  /** Groups the user turned off. Storing these (not the ones on) keeps every group on by default, even ones that load late. */
  const off = ref<EquipmentGroupKey[]>([])
  /** The groups that are on, in API order. */
  const equipment = computed(() => groups.value.map(g => g.key).filter(k => !off.value.includes(k)))
  const equipmentReady = computed(() => !equipmentPending.value && !equipmentFailed.value)
  const exercises = ref<ExerciseDef[]>([])
  const loading = ref(false)

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

  function toggleEquipment(key: EquipmentGroupKey) {
    off.value = off.value.includes(key) ? off.value.filter(k => k !== key) : [...off.value, key]
  }

  // Only the latest request may fill the list, so fast taps never show a stale muscle.
  let request = 0
  watch([selected, equipment, equipmentReady], async ([muscle, equip, ready]) => {
    const id = ++request
    if (!muscle || !ready || !equip.length) {
      exercises.value = []
      loading.value = false
      return
    }
    loading.value = true
    const result = await trainingService.getExercises(muscle, equip)
    if (id !== request) return
    exercises.value = result
    loading.value = false
  })

  return { view, selected, equipment, equipmentReady, exercises, loading, select, toggleEquipment }
}
