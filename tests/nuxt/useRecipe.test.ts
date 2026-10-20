import { describe, expect, it, vi } from 'vitest'
import type { FoodItem } from '~/types/food'

const tahini: FoodItem = { id: 'food_t', name: 'Tahini', brand: 'My food', serving: '15g', per: 15, unit: 'g', step: 5, kcal: 90, p: 3, c: 3, f: 8 }

/** A recipe builder with its draft and catalog loaded from the mocks. */
async function loadedRecipe() {
  const r = useRecipe()
  await vi.waitUntil(() => r.recipe.value && r.catalog.value.length)
  const item = (id: string) => r.catalog.value.find(i => i.id === id)!
  return { ...r, item }
}

describe('useRecipe cost', () => {
  it('is null with no ingredients', async () => {
    const { cost } = await loadedRecipe()
    expect(cost.value).toBeNull()
  })

  it('is null with only a custom ingredient', async () => {
    const { cost, addIngredient } = await loadedRecipe()
    addIngredient(tahini)
    expect(cost.value).toBeNull()
  })

  it('splits the total across servings', async () => {
    const { cost, addIngredient, changeServings, item } = await loadedRecipe()
    addIngredient(item('chicken_boiled')) // 100 g at $1.10
    addIngredient(item('egg_boiled')) // 1 egg at $0.40
    changeServings(1)
    expect(cost.value!.total).toBeCloseTo(1.5)
    expect(cost.value!.perServing).toBeCloseTo(0.75)
    expect(cost.value!.unpriced).toBe(0)
  })

  it('counts a custom food as unpriced and keeps the priced total', async () => {
    const { cost, addIngredient, item } = await loadedRecipe()
    addIngredient(item('chicken_boiled'))
    addIngredient(tahini)
    expect(cost.value!.total).toBeCloseTo(1.1)
    expect(cost.value!.unpriced).toBe(1)
  })
})
