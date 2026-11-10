import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FoodItem, NewFoodInput } from '~/types/food'

const service = vi.hoisted(() => ({
  createFood: vi.fn(),
  updateFood: vi.fn(),
}))
vi.mock('~/services/foodService', async importOriginal => ({ ...await importOriginal<object>(), ...service }))

const bar: FoodItem = {
  id: 'u_bar', name: 'Protein bar, chocolate', serving: '100 g', per: 100, unit: 'g', step: 10, isMine: true, category: 'supplements',
  kcal: 380, p: 33, c: 38, f: 11, fiber: null, price: 1.2, photos: [],
  portions: [{ key: 'p_bar', label: '1 bar', grams: 45 }],
}

/** A form with everything required filled in. */
function filledForm() {
  const form = useIngredientForm('Skyr')
  form.newFood.value = { ...form.newFood.value, category: 'dairy', kcal: '60' }
  return form
}

beforeEach(() => {
  service.createFood.mockReset().mockImplementation(async (input: NewFoodInput) => ({ ...bar, id: 'u_new', name: input.name }))
  service.updateFood.mockReset().mockImplementation(async (id: string, input: NewFoodInput) => ({ ...bar, id, name: input.name }))
})

describe('useIngredientForm missing sentence', () => {
  it('asks for a name, a category and calories', () => {
    const { newFood, missing } = useIngredientForm()
    expect(missing.value).toBe('Add a name, a category and calories to save.')
    newFood.value.name = 'Skyr'
    newFood.value.kcal = '60'
    expect(missing.value).toBe('Add a category to save.')
    newFood.value.category = 'dairy'
    expect(missing.value).toBe('')
  })

  it('blocks saving with an incomplete portion row', () => {
    const { newFood, missing, parsedFood, addPortion } = filledForm()
    addPortion()
    newFood.value.portions[0]!.label = '1 cup'
    expect(missing.value).toBe('Add complete portions to save.')
    expect(parsedFood.value).toBeNull()
    newFood.value.portions[0]!.grams = '245'
    expect(parsedFood.value!.portions).toEqual([{ label: '1 cup', grams: 245 }])
  })

  it('asks for a valid price', () => {
    const { newFood, missing, priceInvalid } = filledForm()
    newFood.value.price = 'abc'
    expect(priceInvalid.value).toBe(true)
    expect(missing.value).toBe('Add a valid price to save.')
  })
})

describe('useIngredientForm values', () => {
  it('clamps calories to 900 and grams to 100, with blank macros as 0 and blank fiber as null', () => {
    const { newFood, parsedFood } = filledForm()
    newFood.value.kcal = '1200'
    newFood.value.p = '150'
    expect(parsedFood.value).toMatchObject({ kcal: 900, p: 100, c: 0, f: 0, fiber: null })
    newFood.value.fiber = '0'
    expect(parsedFood.value!.fiber).toBe(0)
  })

  it('shows the sum error over 100 g, without counting fiber', () => {
    const { newFood, sumInvalid, parsedFood } = filledForm()
    newFood.value = { ...newFood.value, p: '50', c: '40', f: '10.1' }
    expect(sumInvalid.value).toBe(true)
    expect(parsedFood.value).toBeNull()
    newFood.value = { ...newFood.value, f: '0', fiber: '34' }
    expect(sumInvalid.value).toBe(false)
    expect(parsedFood.value).toMatchObject({ p: 50, c: 40, f: 0, fiber: 34 })
  })

  it('keeps a typed price and leaves a blank one out', () => {
    const { newFood, parsedFood } = filledForm()
    expect(parsedFood.value).not.toHaveProperty('price')
    newFood.value.price = '1.2'
    expect(parsedFood.value).toMatchObject({ price: 1.2 })
  })

  it('adds portions up to 10 and removes them', () => {
    const { newFood, addPortion, removePortion } = filledForm()
    for (let i = 0; i < 12; i++) addPortion()
    expect(newFood.value.portions).toHaveLength(10)
    removePortion(0)
    expect(newFood.value.portions).toHaveLength(9)
  })
})

describe('useIngredientForm editing', () => {
  it('prefills portions with their keys, a null fiber as blank, and the price with cents', () => {
    const { newFood, missing } = useIngredientForm('', bar)
    expect(newFood.value).toEqual({
      name: 'Protein bar, chocolate', category: 'supplements', kcal: '380', p: '33', c: '38', f: '11', fiber: '', price: '1.20',
      portions: [{ key: 'p_bar', label: '1 bar', grams: '45' }],
    })
    expect(missing.value).toBe('')
  })

  it('sends the portion keys back to updateFood, and leaves a removed portion out', async () => {
    const { newFood, addPortion, removePortion, save } = useIngredientForm('', { ...bar, portions: [...bar.portions, { key: 'p_two', label: '2 bars', grams: 90 }] })
    newFood.value.portions[0]!.label = '1 small bar'
    removePortion(1)
    addPortion()
    newFood.value.portions[1] = { label: '1 big bar', grams: '60' }
    await save()
    expect(service.updateFood).toHaveBeenCalledWith('u_bar', expect.objectContaining({
      portions: [{ key: 'p_bar', label: '1 small bar', grams: 45 }, { label: '1 big bar', grams: 60 }],
    }))
    expect(service.createFood).not.toHaveBeenCalled()
  })

  it('creates a new food without one', async () => {
    const { save } = filledForm()
    await save()
    expect(service.createFood).toHaveBeenCalledWith(expect.objectContaining({ name: 'Skyr', category: 'dairy', kcal: 60 }))
  })
})

describe('useIngredientForm API errors', () => {
  it('puts a 422 under its field, and portion errors under portions', async () => {
    service.createFood.mockRejectedValue({
      statusCode: 422,
      data: { errors: { 'fat': ['Protein, carbs and fat add up to more than 100 g.'], 'portions.0.grams': ['The grams must be greater than 0.'] } },
    })
    const { save, fieldErrors, formError, newFood } = filledForm()
    await save()
    expect(fieldErrors.value).toEqual({ f: 'Protein, carbs and fat add up to more than 100 g.', portions: 'The grams must be greater than 0.' })
    expect(formError.value).toBe('')
    expect(newFood.value.name).toBe('Skyr')
  })

  it('sets formError on a 500 and keeps the typed values', async () => {
    service.createFood.mockRejectedValue({ statusCode: 500 })
    const { save, formError, fieldErrors, newFood } = filledForm()
    const food = await save()
    expect(food).toBeUndefined()
    expect(formError.value).toBe('Something went wrong. Try again.')
    expect(fieldErrors.value).toEqual({})
    expect(newFood.value.kcal).toBe('60')
  })
})
