import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NewFoodInput } from '~/types/food'

type FoodService = typeof import('~/services/foodService')

// The service keeps its data in module scope; a fresh import per test starts from the seeds.
let foodService: FoodService
beforeEach(async () => {
  vi.resetModules()
  foodService = await import('~/services/foodService')
})

const SEED_IDS_NEWEST_FIRST = ['myfood_pesto', 'myfood_salsa_verde', 'myfood_sourdough', 'myfood_protein_bar']
const salsa: NewFoodInput = { name: 'Salsa verde', per: 100, unit: 'g', kcal: 50, p: 1, c: 8, f: 1 }

describe('getMyFoods', () => {
  it('returns the seeded custom foods, newest first, and no recipes', async () => {
    const foods = await foodService.getMyFoods()
    expect(foods.map(f => f.id)).toEqual(SEED_IDS_NEWEST_FIRST)
    expect(foods.every(f => !f.recipe && f.brand === 'My food')).toBe(true)
  })

  it('puts a newly created food first', async () => {
    const food = await foodService.createFood({ name: 'Tahini', per: 15, unit: 'g', kcal: 90, p: 3, c: 3, f: 8 })
    expect((await foodService.getMyFoods())[0]!.id).toBe(food.id)
  })
})

describe('getMyFood', () => {
  it('returns a custom food', async () => {
    expect((await foodService.getMyFood('myfood_sourdough'))?.name).toBe('Bakery sourdough')
  })

  it('returns null for a recipe id and an unknown id', async () => {
    expect(await foodService.getMyFood('overnight_oats')).toBeNull()
    expect(await foodService.getMyFood('nope')).toBeNull()
  })
})

describe('updateFood', () => {
  it('keeps the id and position', async () => {
    const updated = await foodService.updateFood('myfood_salsa_verde', { ...salsa, category: 'vegetables' })
    expect(updated).toMatchObject({ id: 'myfood_salsa_verde', kcal: 50, category: 'vegetables', serving: '100 g' })
    const foods = await foodService.getMyFoods()
    expect(foods.map(f => f.id)).toEqual(SEED_IDS_NEWEST_FIRST)
    expect(foods[1]!.kcal).toBe(50)
  })

  it('drops price and category when the input has none', async () => {
    const updated = await foodService.updateFood('myfood_protein_bar', { name: 'Homemade protein bar', per: 1, unit: 'piece', kcal: 210, p: 15, c: 22, f: 7 })
    expect('price' in updated).toBe(false)
    expect('category' in updated).toBe(false)
  })

  it('throws for a recipe id', async () => {
    await expect(foodService.updateFood('overnight_oats', salsa)).rejects.toThrow()
  })
})

describe('deleteFood', () => {
  it('removes the food everywhere it can be picked', async () => {
    await foodService.addFoodsToLog([{ item: (await foodService.getMyFood('myfood_pesto'))!, amount: 15 }], 'lunch')
    expect((await foodService.searchFoods('', 'recent')).some(f => f.id === 'myfood_pesto')).toBe(true)

    await foodService.deleteFood('myfood_pesto')

    const has = (foods: { id: string }[]) => foods.some(f => f.id === 'myfood_pesto')
    expect(has(await foodService.getMyFoods())).toBe(false)
    expect(has(await foodService.searchFoods('', 'myfoods'))).toBe(false)
    expect(has(await foodService.searchFoods('', 'recent'))).toBe(false)
    expect(has(await foodService.getIngredientOptions())).toBe(false)
  })

  it('keeps today\'s log entries', async () => {
    await foodService.addFoodsToLog([{ item: (await foodService.getMyFood('myfood_pesto'))!, amount: 15 }], 'lunch')
    await foodService.deleteFood('myfood_pesto')
    expect((await foodService.getFoodLog()).lunch.some(i => i.name === 'Basil pesto')).toBe(true)
  })

  it('throws for a recipe id', async () => {
    await expect(foodService.deleteFood('overnight_oats')).rejects.toThrow()
  })
})
