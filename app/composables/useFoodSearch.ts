import type { FoodItem, FoodSearchTab } from '~/types/food'
import * as foodService from '~/services/foodService'

export const FOOD_SEARCH_TABS: { key: FoodSearchTab, label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'recent', label: 'Recent' },
  { key: 'myfoods', label: 'My Foods' },
]

/** The Quick log's food search. All searches the API and needs 3 letters; Recent and My Foods filter locally with no minimum. */
export function useFoodSearch() {
  const query = ref('')
  const tab = ref<FoodSearchTab>('all')
  const results = ref<FoodItem[] | null>(null)
  const loading = ref(false)
  const failed = ref(false)

  /** True on All while the trimmed query is too short to search: no request is sent and there are no results. */
  const needsMore = computed(() => tab.value === 'all' && query.value.trim().length < foodService.MIN_SEARCH_LENGTH)

  // Only the latest search may change the results, so a slow response never replaces a newer one.
  let requestId = 0
  let debounce: ReturnType<typeof setTimeout> | undefined

  async function run() {
    clearTimeout(debounce)
    const id = ++requestId
    failed.value = false
    if (needsMore.value) {
      results.value = null
      loading.value = false
      return
    }
    loading.value = true
    try {
      const found = await foodService.searchFoods(query.value, tab.value)
      if (id === requestId) results.value = found
    }
    catch {
      if (id === requestId) failed.value = true
    }
    finally {
      if (id === requestId) loading.value = false
    }
  }

  watch(tab, run, { immediate: true })
  watch(query, () => {
    clearTimeout(debounce)
    debounce = setTimeout(run, 200)
  })
  onBeforeUnmount(() => clearTimeout(debounce))

  return { query, tab, results, loading, failed, needsMore, retry: run }
}
