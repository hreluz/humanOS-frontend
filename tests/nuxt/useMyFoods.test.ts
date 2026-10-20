import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MyFoodsFilter } from '~/types/food'

/** A My foods list loaded from the service. The list is shared, loaded-once state, so each test clears it first. */
async function loadedFoods() {
  const r = useMyFoods()
  await vi.waitUntil(() => r.foods.value)
  return r
}

beforeEach(() => {
  clearNuxtState('my-foods')
  clearNuxtData('load:my-foods')
})

describe('useMyFoods filter', () => {
  it.each<[MyFoodsFilter, string[]]>([
    ['all', ['Basil pesto', 'Salsa verde', 'Bakery sourdough', 'Homemade protein bar']],
    ['grains', ['Bakery sourdough']],
    ['none', ['Basil pesto']],
    ['fruit', []],
  ])('%s', async (value, names) => {
    const { filter, filtered } = await loadedFoods()
    filter.value = value
    expect(filtered.value.map(f => f.name)).toEqual(names)
  })
})

describe('useMyFoods remove', () => {
  it('drops the food from the list and flags it while deleting', async () => {
    const { foods, deletingId, remove } = await loadedFoods()
    const done = remove('myfood_salsa_verde')
    expect(deletingId.value).toBe('myfood_salsa_verde')
    await done
    expect(deletingId.value).toBeNull()
    expect(foods.value!.some(f => f.id === 'myfood_salsa_verde')).toBe(false)
  })
})

describe('useMyFood', () => {
  it('loads a custom food', async () => {
    const { food, pending } = useMyFood('myfood_sourdough')
    expect(pending.value).toBe(true)
    await vi.waitUntil(() => !pending.value)
    expect(food.value?.name).toBe('Bakery sourdough')
  })

  it('is null for a recipe id', async () => {
    const { food, pending } = useMyFood('overnight_oats')
    await vi.waitUntil(() => !pending.value)
    expect(food.value).toBeNull()
  })
})
