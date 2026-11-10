import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FoodItem } from '~/types/food'

const service = vi.hoisted(() => ({ searchIngredients: vi.fn<(query: string) => Promise<FoodItem[]>>() }))
vi.mock('~/services/foodService', async importOriginal => ({ ...await importOriginal<object>(), ...service }))

const ingredient = (over: Partial<FoodItem>): FoodItem => ({
  id: 'x', name: 'x', serving: '100 g', per: 100, unit: 'g', step: 10, isMine: false, kcal: 0, p: 0, c: 0, f: 0, portions: [], photos: [], ...over,
})
// Prices are per 100 g.
const chicken = ingredient({ id: 'chicken_breast_roasted', name: 'Chicken breast, roasted', kcal: 165, p: 31, f: 3.57, price: 1.1 })
const egg = ingredient({
  id: 'egg_whole_hard_boiled', name: 'Egg, whole, hard-boiled', kcal: 155, p: 12.6, c: 1.12, f: 10.6, price: 0.8,
  portions: [{ key: 'large', label: '1 large egg', grams: 50 }, { key: 'cup_chopped', label: '1 cup, chopped', grams: 136 }],
})
const tahini = ingredient({ id: 'u_tahini', name: 'Tahini', isMine: true, kcal: 595, p: 17, c: 21, f: 54 })

/** A recipe builder with its draft loaded from the mocks. */
async function loadedRecipe() {
  const r = useRecipe()
  await vi.waitUntil(() => r.recipe.value)
  return r
}

beforeEach(() => {
  service.searchIngredients.mockReset().mockResolvedValue([egg])
})

describe('useRecipe search', () => {
  it('needs 3 letters, then searches the API', async () => {
    const { query, results, needsMore } = await loadedRecipe()
    query.value = 'eg'
    await new Promise(r => setTimeout(r, 250))
    expect(needsMore.value).toBe(true)
    expect(service.searchIngredients).not.toHaveBeenCalled()
    query.value = 'egg'
    await vi.waitUntil(() => results.value?.length)
    expect(service.searchIngredients).toHaveBeenCalledWith('egg')
  })

  it('sets failed when the search fails, and retry recovers', async () => {
    service.searchIngredients.mockRejectedValueOnce({ statusCode: 500 })
    const { query, failed, results, retry } = await loadedRecipe()
    query.value = 'egg'
    await vi.waitUntil(() => failed.value)
    await retry()
    expect(failed.value).toBe(false)
    expect(results.value).toHaveLength(1)
  })
})

describe('useRecipe lines', () => {
  it('starts an ingredient with portions at 1 × the first one, and one without at 100 g', async () => {
    const { recipe, addIngredient } = await loadedRecipe()
    addIngredient(egg)
    addIngredient(chicken)
    expect(recipe.value!.ingredients.map(i => [i.amount, i.portion])).toEqual([[1, 'large'], [100, undefined]])
  })

  it('steps a line already listed by one step of its current unit', async () => {
    const { recipe, addIngredient } = await loadedRecipe()
    addIngredient(egg)
    addIngredient(egg)
    addIngredient(chicken)
    addIngredient(chicken)
    expect(recipe.value!.ingredients.map(i => i.amount)).toEqual([2, 110])
  })

  it('sets 1 or 100 when the unit changes, converting nothing', async () => {
    const { recipe, addIngredient, setUnit } = await loadedRecipe()
    addIngredient(egg)
    setUnit(0, null)
    expect(recipe.value!.ingredients[0]).toMatchObject({ amount: 100 })
    expect(recipe.value!.ingredients[0]!.portion).toBeUndefined()
    setUnit(0, 'cup_chopped')
    expect(recipe.value!.ingredients[0]).toMatchObject({ amount: 1, portion: 'cup_chopped' })
  })
})

describe('useRecipe cost', () => {
  it('is null with no ingredients, and with only unpriced ones', async () => {
    const { cost, addIngredient } = await loadedRecipe()
    expect(cost.value).toBeNull()
    addIngredient(tahini)
    expect(cost.value).toBeNull()
  })

  it('costs portions through their grams and splits the total across servings', async () => {
    const { cost, addIngredient, changeServings } = await loadedRecipe()
    addIngredient(chicken) // 100 g at $1.10
    addIngredient(egg) // 1 large egg, 50 g at $0.80 / 100 g
    changeServings(1)
    expect(cost.value!.total).toBeCloseTo(1.5)
    expect(cost.value!.perServing).toBeCloseTo(0.75)
    expect(cost.value!.unpriced).toBe(0)
  })

  it('counts an unpriced line and keeps the priced total', async () => {
    const { cost, addIngredient } = await loadedRecipe()
    addIngredient(chicken)
    addIngredient(tahini)
    expect(cost.value!.total).toBeCloseTo(1.1)
    expect(cost.value!.unpriced).toBe(1)
  })
})
