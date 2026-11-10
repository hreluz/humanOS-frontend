import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { components } from '~/types/api.generated'
import type { NewFoodInput } from '~/types/food'
import { api } from '~/services/api'

vi.mock('~/services/api')

type FoodService = typeof import('~/services/foodService')
type IngredientResource = components['schemas']['IngredientResource']

// The service keeps prices, recipes and Recent in module scope; a fresh import per test starts from the seeds.
let foodService: FoodService
beforeEach(async () => {
  vi.resetAllMocks()
  vi.resetModules()
  foodService = await import('~/services/foodService')
})

const egg: IngredientResource = {
  key: 'egg_whole_hard_boiled',
  name: 'Egg, whole, hard-boiled',
  category: 'eggs',
  is_mine: false,
  per_100g: { kcal: 155, protein: 12.6, carbs: 1.12, fat: 10.6, fiber: 0 },
  portions: [
    { key: 'large', label: '1 large egg', grams: 50 },
    { key: 'cup_chopped', label: '1 cup, chopped', grams: 136 },
  ],
  photos: [{
    url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Boiled_Egg_-_Crossection.jpg?width=960',
    thumbnail_url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Boiled_Egg_-_Crossection.jpg?width=330',
    license: 'CC BY-SA 2.0',
    license_url: 'https://creativecommons.org/licenses/by-sa/2.0',
    author: 'Ramesh NG',
    credit_url: 'https://commons.wikimedia.org/wiki/File:Boiled_Egg_-_Crossection.jpg',
  }],
}

const bar = (over: Partial<IngredientResource> = {}): IngredientResource => ({
  key: 'u_bar', name: 'Protein bar, chocolate', category: 'supplements', is_mine: true,
  per_100g: { kcal: 380, protein: 33, carbs: 38, fat: 11, fiber: null },
  portions: [{ key: 'p_bar', label: '1 bar', grams: 45 }], photos: [], ...over,
})

const barInput: NewFoodInput = {
  name: 'Protein bar, chocolate', category: 'supplements', kcal: 380, p: 33, c: 38, f: 11, fiber: 9,
  portions: [{ label: '1 bar', grams: 45 }], price: 1.2,
}

const page = (data: IngredientResource[], current = 1, last = 1) => ({ data, meta: { current_page: current, last_page: last } })

describe('toFood', () => {
  it('maps the egg response per 100 g, with portions and camelCase photo fields', () => {
    expect(foodService.toFood(egg)).toEqual({
      id: 'egg_whole_hard_boiled', name: 'Egg, whole, hard-boiled', serving: '100 g', per: 100, unit: 'g', step: 10,
      isMine: false, category: 'eggs', kcal: 155, p: 12.6, c: 1.12, f: 10.6, fiber: 0,
      portions: [{ key: 'large', label: '1 large egg', grams: 50 }, { key: 'cup_chopped', label: '1 cup, chopped', grams: 136 }],
      photos: [{
        url: egg.photos[0]!.url, thumbnailUrl: egg.photos[0]!.thumbnail_url, license: 'CC BY-SA 2.0',
        licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0', author: 'Ramesh NG', creditUrl: egg.photos[0]!.credit_url,
      }],
    })
  })

  it('keeps fiber: null', () => {
    expect(foodService.toFood(bar()).fiber).toBeNull()
  })
})

describe('searchIngredients', () => {
  it('sends the search and keeps the API\'s order', async () => {
    vi.mocked(api).mockResolvedValue({ data: [egg, bar({ key: 'u_eggnog', name: 'Eggnog' })] })
    const found = await foodService.searchIngredients('egg')
    expect(api).toHaveBeenCalledWith('/v1/nutrition/ingredients', { query: { search: 'egg' } })
    expect(found.map(f => f.id)).toEqual(['egg_whole_hard_boiled', 'u_eggnog'])
  })

  it('rejects when the API call fails', async () => {
    vi.mocked(api).mockRejectedValue({ statusCode: 500 })
    await expect(foodService.searchIngredients('egg')).rejects.toEqual({ statusCode: 500 })
  })
})

describe('searchFoods', () => {
  it('sends no request on All below 3 letters', async () => {
    expect(await foodService.searchFoods('eg', 'all')).toEqual([])
    expect(api).not.toHaveBeenCalled()
  })

  it('puts matching recipes ahead of the API results on All', async () => {
    vi.mocked(api).mockResolvedValue({ data: [egg] })
    const found = await foodService.searchFoods('oats', 'all')
    expect(found[0]!.name).toBe('Overnight oats')
    expect(found.at(-1)!.id).toBe('egg_whole_hard_boiled')
  })

  it('filters recipes and page 1 of the user\'s foods on My Foods, with no minimum', async () => {
    vi.mocked(api).mockResolvedValue(page([bar(), bar({ key: 'u_salsa', name: 'Salsa verde' })]))
    const found = await foodService.searchFoods('sa', 'myfoods')
    expect(api).toHaveBeenCalledWith('/v1/nutrition/my-ingredients', { query: { page: 1, per_page: 100 } })
    expect(found.map(f => f.name)).toContain('Salsa verde')
    expect(found.map(f => f.name)).not.toContain('Protein bar, chocolate')
  })

  it('starts Recent with the seeded recipes and adds logged copies in front', async () => {
    expect((await foodService.searchFoods('', 'recent')).map(f => f.id)).toEqual(['overnight_oats', 'my_bowl'])
    await foodService.addFoodsToLog([{ item: foodService.toFood(egg), amount: 2, portion: 'large' }], 'lunch')
    expect((await foodService.searchFoods('', 'recent')).map(f => f.id)).toEqual(['egg_whole_hard_boiled', 'overnight_oats', 'my_bowl'])
  })
})

describe('addFoodsToLog', () => {
  it('stores the portion text and its macros', async () => {
    const log = await foodService.addFoodsToLog([{ item: foodService.toFood(egg), amount: 2, portion: 'large' }], 'lunch')
    expect(log.lunch.at(-1)).toMatchObject({ name: 'Egg, whole, hard-boiled', portion: '2 × 1 large egg (100 g)', kcal: 155 })
  })
})

describe('getMyFoods', () => {
  it('sends page and per_page=100, and reports more pages', async () => {
    vi.mocked(api).mockResolvedValue(page([bar()], 1, 2))
    const result = await foodService.getMyFoods(1)
    expect(api).toHaveBeenCalledWith('/v1/nutrition/my-ingredients', { query: { page: 1, per_page: 100 } })
    expect(result.items.map(f => f.id)).toEqual(['u_bar'])
    expect(result.hasMore).toBe(true)
  })

  it('has no more on the last page', async () => {
    vi.mocked(api).mockResolvedValue(page([bar()], 2, 2))
    expect((await foodService.getMyFoods(2)).hasMore).toBe(false)
  })
})

describe('getMyFood', () => {
  it('returns the user\'s own ingredient', async () => {
    vi.mocked(api).mockResolvedValue({ data: bar() })
    expect((await foodService.getMyFood('u_bar'))?.name).toBe('Protein bar, chocolate')
    expect(api).toHaveBeenCalledWith('/v1/nutrition/ingredients/u_bar')
  })

  it('returns null on a 404 and for a catalog ingredient', async () => {
    vi.mocked(api).mockRejectedValueOnce({ statusCode: 404 })
    expect(await foodService.getMyFood('u_unknown')).toBeNull()
    vi.mocked(api).mockResolvedValueOnce({ data: egg })
    expect(await foodService.getMyFood('egg_whole_hard_boiled')).toBeNull()
  })

  it('passes other errors on', async () => {
    vi.mocked(api).mockRejectedValue({ statusCode: 500 })
    await expect(foodService.getMyFood('u_bar')).rejects.toEqual({ statusCode: 500 })
  })
})

describe('createFood', () => {
  it('posts the food per 100 g and keeps its price in the store', async () => {
    vi.mocked(api).mockResolvedValue({ data: bar() })
    const food = await foodService.createFood(barInput)
    expect(api).toHaveBeenCalledWith('/v1/nutrition/ingredients', {
      method: 'POST',
      body: { name: 'Protein bar, chocolate', category: 'supplements', kcal: 380, protein: 33, carbs: 38, fat: 11, fiber: 9, portions: [{ label: '1 bar', grams: 45 }] },
    })
    expect(food.price).toBe(1.2)
  })
})

describe('updateFood', () => {
  it('patches every field, with keys on existing portions', async () => {
    vi.mocked(api).mockResolvedValue({ data: bar() })
    await foodService.updateFood('u_bar', { ...barInput, portions: [{ key: 'p_bar', label: '1 bar', grams: 50 }, { label: '2 bars', grams: 100 }] })
    expect(api).toHaveBeenCalledWith('/v1/nutrition/ingredients/u_bar', {
      method: 'PATCH',
      body: {
        name: 'Protein bar, chocolate', category: 'supplements', kcal: 380, protein: 33, carbs: 38, fat: 11, fiber: 9,
        portions: [{ key: 'p_bar', label: '1 bar', grams: 50 }, { label: '2 bars', grams: 100 }],
      },
    })
  })

  it('removes the price when the form leaves it blank', async () => {
    vi.mocked(api).mockResolvedValue({ data: bar() })
    expect((await foodService.updateFood('u_bar', barInput)).price).toBe(1.2)
    const { price: _, ...unpriced } = barInput
    expect(await foodService.updateFood('u_bar', unpriced)).not.toHaveProperty('price')
  })

  it('replaces the Recent copy', async () => {
    vi.mocked(api).mockResolvedValue({ data: bar() })
    await foodService.addFoodsToLog([{ item: foodService.toFood(bar()), amount: 1, portion: 'p_bar' }], 'snacks')
    vi.mocked(api).mockResolvedValue({ data: bar({ name: 'Protein bar, dark chocolate' }) })
    await foodService.updateFood('u_bar', barInput)
    expect((await foodService.searchFoods('', 'recent'))[0]!.name).toBe('Protein bar, dark chocolate')
  })
})

describe('deleteFood', () => {
  it('sends DELETE and removes the price and the Recent copy', async () => {
    vi.mocked(api).mockResolvedValue({ data: bar() })
    await foodService.createFood(barInput)
    await foodService.addFoodsToLog([{ item: foodService.toFood(bar()), amount: 1, portion: 'p_bar' }], 'snacks')

    vi.mocked(api).mockResolvedValue(undefined)
    await foodService.deleteFood('u_bar')
    expect(api).toHaveBeenLastCalledWith('/v1/nutrition/ingredients/u_bar', { method: 'DELETE' })
    expect((await foodService.searchFoods('', 'recent')).some(f => f.id === 'u_bar')).toBe(false)
    expect(foodService.toFood(bar())).not.toHaveProperty('price')
  })

  it('keeps today\'s log entries', async () => {
    await foodService.addFoodsToLog([{ item: foodService.toFood(bar()), amount: 1, portion: 'p_bar' }], 'snacks')
    vi.mocked(api).mockResolvedValue(undefined)
    await foodService.deleteFood('u_bar')
    expect((await foodService.getFoodLog()).snacks.some(i => i.name === 'Protein bar, chocolate')).toBe(true)
  })
})

describe('seeded recipes', () => {
  it('carry ingredient copies in grams and load in My Foods', async () => {
    vi.mocked(api).mockResolvedValue(page([]))
    const oats = (await foodService.searchFoods('overnight', 'myfoods'))[0]!
    expect(oats.recipe!.ingredients.map(i => [i.item.id, i.amount])).toEqual([['oats_rolled', 40], ['milk_whole', 124], ['blueberries', 50], ['honey', 7]])
    expect(oats).toMatchObject({ isMine: true, unit: 'serving', portions: [], photos: [] })
  })
})
