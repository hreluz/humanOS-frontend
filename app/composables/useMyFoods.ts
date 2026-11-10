import type { FoodItem, MyFoodsFilter } from '~/types/food'
import * as foodService from '~/services/foodService'

/**
 * The user's own ingredients for the My foods page, from the API by name, 100 at a time: the loaded list, a category
 * filter over it, more pages on demand, and delete.
 */
export function useMyFoods() {
  const foods = ref<FoodItem[] | null>(null)
  const loading = ref(false)
  const failed = ref(false)
  const hasMore = ref(false)
  const loadingMore = ref(false)
  const loadMoreFailed = ref(false)
  const filter = ref<MyFoodsFilter>('all')
  const deletingId = ref<string | null>(null)

  /** Only the loaded pages are filtered; `Load more` stays available for the rest. */
  const filtered = computed(() => {
    const list = foods.value ?? []
    return filter.value === 'all' ? list : list.filter(f => f.category === filter.value)
  })

  // A refresh starts the list over; responses from before it are dropped.
  let request = 0
  let page = 1

  /** Loads page 1 again, replacing the list. */
  async function refresh() {
    const id = ++request
    page = 1
    loading.value = true
    failed.value = false
    loadingMore.value = false
    loadMoreFailed.value = false
    try {
      const result = await foodService.getMyFoods(1)
      if (id !== request) return
      foods.value = result.items
      hasMore.value = result.hasMore
    }
    catch {
      if (id === request) failed.value = true
    }
    finally {
      if (id === request) loading.value = false
    }
  }
  refresh()

  /** Appends the next page. After a failure the list stays, and the next try asks for the same page. */
  async function loadMore() {
    if (loadingMore.value || !hasMore.value) return
    const id = request
    loadingMore.value = true
    loadMoreFailed.value = false
    try {
      const result = await foodService.getMyFoods(page + 1)
      if (id !== request) return
      page++
      foods.value = [...foods.value ?? [], ...result.items]
      hasMore.value = result.hasMore
    }
    catch {
      if (id === request) loadMoreFailed.value = true
    }
    finally {
      if (id === request) loadingMore.value = false
    }
  }

  /** Deletes a food and drops its row, with no refetch. Throws when the delete fails, and the row stays. */
  async function remove(key: string) {
    if (deletingId.value) return
    deletingId.value = key
    try {
      await foodService.deleteFood(key)
      foods.value = (foods.value ?? []).filter(f => f.id !== key)
    }
    finally {
      deletingId.value = null
    }
  }

  return { foods, loading, failed, retry: refresh, hasMore, loadingMore, loadMoreFailed, loadMore, filter, filtered, refresh, remove, deletingId }
}

/** One of the user's ingredients for the edit page, always fetched fresh. A 404 is `food: null` without `failed`. */
export function useMyFood(key: string) {
  const food = ref<FoodItem | null>(null)
  const pending = ref(true)
  const failed = ref(false)

  async function load() {
    pending.value = true
    failed.value = false
    try {
      food.value = await foodService.getMyFood(key)
    }
    catch {
      failed.value = true
    }
    finally {
      pending.value = false
    }
  }
  load()

  return { food, pending, failed, retry: load }
}
