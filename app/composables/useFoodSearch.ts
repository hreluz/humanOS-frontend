import type { FoodItem, FoodSearchTab } from '~/types/food'
import * as foodService from '~/services/foodService'

export const FOOD_SEARCH_TABS: { key: FoodSearchTab, label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'recent', label: 'Recent' },
  { key: 'myfoods', label: 'My Foods' },
  { key: 'verified', label: 'Verified' },
]

export function useFoodSearch() {
  const query = ref('')
  const tab = ref<FoodSearchTab>('all')
  const results = ref<FoodItem[] | null>(null)
  const loading = ref(false)

  let requestId = 0
  let debounce: ReturnType<typeof setTimeout> | undefined

  async function run() {
    const id = ++requestId
    loading.value = true
    const found = await foodService.searchFoods(query.value, tab.value)
    if (id !== requestId) return
    results.value = found
    loading.value = false
  }

  watch(tab, run, { immediate: true })
  watch(query, () => {
    clearTimeout(debounce)
    debounce = setTimeout(run, 200)
  })
  onBeforeUnmount(() => clearTimeout(debounce))

  return { query, tab, results, loading }
}
