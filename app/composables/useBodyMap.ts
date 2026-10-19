import type { BodyView, EquipmentKey, ExerciseDef, MuscleKey } from '~/types/training'
import * as trainingService from '~/services/trainingService'

/** Body map state: which side is shown, the picked muscle, the equipment filter and the matching exercises. */
export function useBodyMap() {
  const view = ref<BodyView>('front')
  const selected = ref<MuscleKey | null>(null)
  const equipment = ref<EquipmentKey[]>([...EQUIPMENT_KEYS])
  const exercises = ref<ExerciseDef[]>([])
  const loading = ref(false)

  /** Picks a muscle, turning the figure around if it isn't drawn on the side being shown. */
  function select(muscle: MuscleKey) {
    selected.value = muscle
    if (!isOnView(muscle, view.value)) view.value = muscleView(muscle)
  }

  function toggleEquipment(key: EquipmentKey) {
    equipment.value = equipment.value.includes(key)
      ? equipment.value.filter(k => k !== key)
      : EQUIPMENT_KEYS.filter(k => k === key || equipment.value.includes(k))
  }

  // Only the latest request may fill the list, so fast taps never show a stale muscle.
  let request = 0
  watch([selected, equipment], async ([muscle, equip]) => {
    const id = ++request
    if (!muscle || !equip.length) {
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

  return { view, selected, equipment, exercises, loading, select, toggleEquipment }
}
