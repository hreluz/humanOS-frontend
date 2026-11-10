import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { components } from '~/types/api.generated'
import type { IngredientCategory, MyFoodsFilter } from '~/types/food'
import { api } from '~/services/api'

vi.mock('~/services/api')

type IngredientResource = components['schemas']['IngredientResource']

const own = (key: string, name: string, category: IngredientCategory = 'other', is_mine = true): IngredientResource => ({
  key, name, category, is_mine, per_100g: { kcal: 100, protein: 1, carbs: 1, fat: 1, fiber: null }, portions: [], photos: [],
})
const page = (data: IngredientResource[], current = 1, last = 1) => ({ data, meta: { current_page: current, last_page: last } })

const PAGE_1 = [own('u_pesto', 'Basil pesto', 'condiments'), own('u_sourdough', 'Bakery sourdough', 'grains'), own('u_salsa', 'Salsa verde', 'condiments')]

/** A My foods list with its first page loaded. */
async function loadedFoods() {
  const r = useMyFoods()
  await vi.waitUntil(() => r.foods.value || r.failed.value)
  return r
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(api).mockResolvedValue(page(PAGE_1))
})

describe('useMyFoods loading', () => {
  it('sends page and per_page=100, and keeps the API\'s order', async () => {
    const { foods } = await loadedFoods()
    expect(api).toHaveBeenCalledWith('/v1/nutrition/my-ingredients', { query: { page: 1, per_page: 100 } })
    expect(foods.value!.map(f => f.name)).toEqual(['Basil pesto', 'Bakery sourdough', 'Salsa verde'])
  })

  it('appends page 2 with loadMore', async () => {
    vi.mocked(api).mockResolvedValueOnce(page(PAGE_1, 1, 2)).mockResolvedValueOnce(page([own('u_tahini', 'Tahini')], 2, 2))
    const { foods, hasMore, loadMore } = await loadedFoods()
    expect(hasMore.value).toBe(true)
    await loadMore()
    expect(api).toHaveBeenLastCalledWith('/v1/nutrition/my-ingredients', { query: { page: 2, per_page: 100 } })
    expect(foods.value!.map(f => f.id)).toEqual(['u_pesto', 'u_sourdough', 'u_salsa', 'u_tahini'])
    expect(hasMore.value).toBe(false)
  })

  it('keeps the list when a page fails, and asks for the same page again', async () => {
    vi.mocked(api).mockResolvedValueOnce(page(PAGE_1, 1, 2)).mockRejectedValueOnce({ statusCode: 500 }).mockResolvedValueOnce(page([own('u_tahini', 'Tahini')], 2, 2))
    const { foods, loadMore, loadMoreFailed } = await loadedFoods()
    await loadMore()
    expect(loadMoreFailed.value).toBe(true)
    expect(foods.value).toHaveLength(3)
    await loadMore()
    expect(vi.mocked(api).mock.calls.slice(1).map(c => (c[1] as { query: { page: number } }).query.page)).toEqual([2, 2])
    expect(loadMoreFailed.value).toBe(false)
    expect(foods.value).toHaveLength(4)
  })

  it('ignores loadMore while a page is in flight', async () => {
    vi.mocked(api).mockResolvedValueOnce(page(PAGE_1, 1, 3)).mockResolvedValue(page([own('u_tahini', 'Tahini')], 2, 3))
    const { loadMore } = await loadedFoods()
    await Promise.all([loadMore(), loadMore()])
    expect(api).toHaveBeenCalledTimes(2)
  })

  it('sets failed when the first page fails, and retry loads it', async () => {
    vi.mocked(api).mockRejectedValueOnce({ statusCode: 500 })
    const { foods, failed, retry } = await loadedFoods()
    expect(failed.value).toBe(true)
    expect(foods.value).toBeNull()
    await retry()
    expect(failed.value).toBe(false)
    expect(foods.value).toHaveLength(3)
  })
})

describe('useMyFoods filter', () => {
  it.each<[MyFoodsFilter, string[]]>([
    ['all', ['Basil pesto', 'Bakery sourdough', 'Salsa verde']],
    ['condiments', ['Basil pesto', 'Salsa verde']],
    ['fruit', []],
  ])('%s', async (value, names) => {
    const { filter, filtered } = await loadedFoods()
    filter.value = value
    expect(filtered.value.map(f => f.name)).toEqual(names)
  })
})

describe('useMyFoods remove', () => {
  it('drops the row without a refetch, and flags it while deleting', async () => {
    const { foods, deletingId, remove } = await loadedFoods()
    vi.mocked(api).mockClear().mockResolvedValue(undefined)
    const done = remove('u_salsa')
    expect(deletingId.value).toBe('u_salsa')
    await done
    expect(api).toHaveBeenCalledTimes(1)
    expect(api).toHaveBeenCalledWith('/v1/nutrition/ingredients/u_salsa', { method: 'DELETE' })
    expect(deletingId.value).toBeNull()
    expect(foods.value!.map(f => f.id)).toEqual(['u_pesto', 'u_sourdough'])
  })

  it('keeps the row when the delete fails', async () => {
    const { foods, remove } = await loadedFoods()
    vi.mocked(api).mockRejectedValue({ statusCode: 500 })
    await expect(remove('u_salsa')).rejects.toEqual({ statusCode: 500 })
    expect(foods.value).toHaveLength(3)
  })
})

describe('useMyFood', () => {
  it('loads one of the user\'s foods', async () => {
    vi.mocked(api).mockResolvedValue({ data: own('u_sourdough', 'Bakery sourdough') })
    const { food, pending } = useMyFood('u_sourdough')
    expect(pending.value).toBe(true)
    await vi.waitUntil(() => !pending.value)
    expect(food.value?.name).toBe('Bakery sourdough')
  })

  it('is null without failing on a 404 and for a catalog ingredient', async () => {
    vi.mocked(api).mockRejectedValueOnce({ statusCode: 404 })
    const missing = useMyFood('u_unknown')
    await vi.waitUntil(() => !missing.pending.value)
    expect(missing.food.value).toBeNull()
    expect(missing.failed.value).toBe(false)

    vi.mocked(api).mockResolvedValueOnce({ data: own('banana', 'Banana', 'fruit', false) })
    const catalog = useMyFood('banana')
    await vi.waitUntil(() => !catalog.pending.value)
    expect(catalog.food.value).toBeNull()
  })

  it('fails on other errors, and retry loads it', async () => {
    vi.mocked(api).mockRejectedValueOnce({ statusCode: 500 }).mockResolvedValueOnce({ data: own('u_sourdough', 'Bakery sourdough') })
    const { food, failed, pending, retry } = useMyFood('u_sourdough')
    await vi.waitUntil(() => !pending.value)
    expect(failed.value).toBe(true)
    await retry()
    expect(food.value?.name).toBe('Bakery sourdough')
  })
})
