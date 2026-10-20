import type { ExerciseDef } from '~/types/training'

/** The exercise whose photos are open in the viewer modal, and the photo being shown. */
export function useExercisePhotos() {
  const exercise = useState<ExerciseDef | null>('photo-exercise', () => null)
  const index = useState('photo-index', () => 0)
  const { open } = useModal()

  const photos = computed(() => exercise.value?.photos ?? [])
  const current = computed(() => photos.value[index.value] ?? null)

  function openPhotos(def: ExerciseDef, at = 0) {
    exercise.value = def
    index.value = at
    open('exercisePhotos')
  }

  const goTo = (i: number) => {
    const n = photos.value.length
    if (n) index.value = ((i % n) + n) % n
  }
  const next = () => goTo(index.value + 1)
  const prev = () => goTo(index.value - 1)

  return { exercise, photos, index, current, openPhotos, goTo, next, prev }
}
