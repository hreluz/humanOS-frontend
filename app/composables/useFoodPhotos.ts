import type { FoodItem } from '~/types/food'

/** The food whose photos are open in the viewer modal, and the photo being shown. */
export function useFoodPhotos() {
  const food = useState<FoodItem | null>('photo-food', () => null)
  const index = useState('food-photo-index', () => 0)
  const { open } = useModal()

  const photos = computed(() => food.value?.photos ?? [])
  const current = computed(() => photos.value[index.value] ?? null)

  /** Opens the viewer on the food's first photo. */
  function openPhotos(item: FoodItem) {
    food.value = item
    index.value = 0
    open('foodPhotos')
  }

  return { food, photos, index, current, openPhotos }
}
