import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FoodItem, FoodSearchTab } from '~/types/food'

const service = vi.hoisted(() => ({ searchFoods: vi.fn<(query: string, tab: FoodSearchTab) => Promise<FoodItem[]>>() }))
vi.mock('~/services/foodService', async importOriginal => ({ ...await importOriginal<object>(), ...service }))

const food = (name: string): FoodItem => ({
  id: name, name, serving: '100 g', per: 100, unit: 'g', step: 10, isMine: false, kcal: 100, p: 1, c: 1, f: 1, portions: [], photos: [],
})

/** A promise the test settles by hand, to finish requests out of order. */
function deferred<T>() {
  let resolve!: (v: T) => void
  const promise = new Promise<T>((r) => { resolve = r })
  return { promise, resolve }
}

beforeEach(() => {
  service.searchFoods.mockReset()
  service.searchFoods.mockResolvedValue([])
})

describe('useFoodSearch', () => {
  it('needs 3 letters on All, and sends no request until then', async () => {
    const { query, results, needsMore } = useFoodSearch()
    expect(needsMore.value).toBe(true)
    query.value = 'eg'
    await new Promise(r => setTimeout(r, 250))
    expect(service.searchFoods).not.toHaveBeenCalled()
    expect(results.value).toBeNull()

    service.searchFoods.mockResolvedValue([food('Egg')])
    query.value = 'egg'
    expect(needsMore.value).toBe(false)
    await vi.waitUntil(() => results.value?.length)
    expect(service.searchFoods).toHaveBeenCalledWith('egg', 'all')
  })

  it('searches Recent and My Foods with no minimum', async () => {
    const { tab, needsMore } = useFoodSearch()
    tab.value = 'recent'
    expect(needsMore.value).toBe(false)
    await vi.waitUntil(() => service.searchFoods.mock.calls.length)
    expect(service.searchFoods).toHaveBeenCalledWith('', 'recent')
  })

  it('sets failed and keeps the query, and retry runs the same search', async () => {
    const { query, failed, results, retry } = useFoodSearch()
    service.searchFoods.mockRejectedValueOnce({ statusCode: 500 })
    query.value = 'egg'
    await vi.waitUntil(() => failed.value)
    expect(query.value).toBe('egg')

    service.searchFoods.mockResolvedValue([food('Egg')])
    await retry()
    expect(failed.value).toBe(false)
    expect(results.value!.map(f => f.name)).toEqual(['Egg'])
    expect(service.searchFoods).toHaveBeenLastCalledWith('egg', 'all')
  })

  it('drops a stale response that arrives after a newer one', async () => {
    const { tab, results, loading } = useFoodSearch()
    const slow = deferred<FoodItem[]>()
    service.searchFoods.mockReturnValueOnce(slow.promise).mockResolvedValueOnce([food('Overnight oats')])
    tab.value = 'recent'
    await nextTick()
    tab.value = 'myfoods'
    await vi.waitUntil(() => results.value?.length)
    slow.resolve([food('Stale')])
    await new Promise(r => setTimeout(r, 0))
    expect(results.value!.map(f => f.name)).toEqual(['Overnight oats'])
    expect(loading.value).toBe(false)
  })
})
