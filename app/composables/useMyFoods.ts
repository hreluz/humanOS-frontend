import type { FoodItem, MyFoodsFilter } from '~/types/food'
import * as foodService from '~/services/foodService'

/** The user's custom ingredients for the My foods page: the list, a category filter and delete. */
export function useMyFoods() {
  const { state: foods, pending } = useServiceState('my-foods', foodService.getMyFoods)
  const filter = ref<MyFoodsFilter>('all')
  const deletingId = ref<string | null>(null)

  /** `'none'` keeps the foods saved without a category. */
  const filtered = computed(() => {
    const list = foods.value ?? []
    if (filter.value === 'all') return list
    if (filter.value === 'none') return list.filter(f => !f.category)
    return list.filter(f => f.category === filter.value)
  })

  async function refresh() {
    foods.value = await foodService.getMyFoods()
  }

  async function remove(id: string) {
    if (deletingId.value) return
    deletingId.value = id
    try {
      await foodService.deleteFood(id)
      await refresh()
    }
    finally {
      deletingId.value = null
    }
  }

  return { foods, pending, filter, filtered, deletingId, refresh, remove }
}

/** One custom ingredient for the edit page, always fetched fresh; null when it doesn't exist. */
export function useMyFood(id: string) {
  const food = ref<FoodItem | null>(null)
  const pending = ref(true)
  foodService.getMyFood(id)
    .then((f) => { food.value = f })
    .finally(() => { pending.value = false })
  return { food, pending }
}
