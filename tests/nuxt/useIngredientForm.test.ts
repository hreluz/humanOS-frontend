import { describe, expect, it, vi } from 'vitest'
import type { FoodItem, NewFoodInput } from '~/types/food'
import { MY_FOODS } from '~/services/mocks/myFoods'

const service = vi.hoisted(() => ({
  createFood: vi.fn(async (input: NewFoodInput) => ({ ...input, id: 'food_new' }) as unknown as FoodItem),
  updateFood: vi.fn(async (id: string, input: NewFoodInput) => ({ ...input, id }) as unknown as FoodItem),
}))
vi.mock('~/services/foodService', async importOriginal => ({ ...await importOriginal<object>(), ...service }))

const seed = (id: string) => {
  const { id: _, ...input } = MY_FOODS.find(f => f.id === id)!
  return buildFood(input, id)
}

describe('useIngredientForm', () => {
  it('says what is still missing before it can save', () => {
    const { newFood, missing, parsedFood } = useIngredientForm()
    expect(missing.value).toBe('Add a name and calories to save.')
    newFood.value.per = 'abc'
    expect(missing.value).toBe('Add a name, an amount and calories to save.')
    newFood.value = { ...newFood.value, name: 'Tahini', per: '15', kcal: '90' }
    expect(missing.value).toBe('')
    expect(parsedFood.value).toEqual({ name: 'Tahini', per: 15, unit: 'g', kcal: 90, p: 0, c: 0, f: 0 })
  })

  it('saves a typed price and leaves a blank one out', () => {
    const { newFood, parsedFood } = useIngredientForm('Tahini')
    newFood.value.kcal = '595'
    expect(parsedFood.value).not.toHaveProperty('price')
    newFood.value.price = '2.5'
    expect(parsedFood.value).toMatchObject({ price: 2.5 })
  })

  it('blocks saving with a price that is not a number above 0', () => {
    const { newFood, missing, priceInvalid, parsedFood } = useIngredientForm('Tahini')
    newFood.value.kcal = '595'
    for (const t of ['abc', '0']) {
      newFood.value.price = t
      expect(priceInvalid.value).toBe(true)
      expect(missing.value).toBe('Add a valid price to save.')
      expect(parsedFood.value).toBeNull()
    }
  })

  it('saves a picked category and leaves no category out', () => {
    const { newFood, parsedFood } = useIngredientForm('Skyr')
    newFood.value.kcal = '60'
    expect(parsedFood.value).not.toHaveProperty('category')
    newFood.value.category = 'dairy'
    expect(parsedFood.value).toMatchObject({ category: 'dairy' })
  })

  it('never asks for a category', () => {
    const { newFood, missing } = useIngredientForm()
    expect(missing.value).toBe('Add a name and calories to save.')
    newFood.value = { ...newFood.value, name: 'Skyr', kcal: '60' }
    expect(missing.value).toBe('')
  })

  it('starts from the searched name', () => {
    const { missing } = useIngredientForm('Tahini')
    expect(missing.value).toBe('Add calories to save.')
  })
})

describe('useIngredientForm editing', () => {
  it('prefills the form from a priced, categorized food', () => {
    const { newFood, missing } = useIngredientForm('', seed('myfood_protein_bar'))
    expect(newFood.value).toEqual({ name: 'Homemade protein bar', per: '1', unit: 'piece', kcal: '210', p: '15', c: '22', f: '7', price: '1.20', category: 'other' })
    expect(missing.value).toBe('')
  })

  it('prefills a blank price and category when the food has none', () => {
    const { newFood } = useIngredientForm('', seed('myfood_pesto'))
    expect(newFood.value.price).toBe('')
    expect(newFood.value.category).toBe('')
  })

  it('drops a cleared price and category from the saved food', () => {
    const { newFood, parsedFood } = useIngredientForm('', seed('myfood_protein_bar'))
    newFood.value.price = ''
    newFood.value.category = ''
    expect(parsedFood.value).not.toHaveProperty('price')
    expect(parsedFood.value).not.toHaveProperty('category')
  })

  it('updates the edited food on save', async () => {
    const { newFood, save } = useIngredientForm('', seed('myfood_salsa_verde'))
    newFood.value.kcal = '50'
    const food = await save()
    expect(service.updateFood).toHaveBeenCalledWith('myfood_salsa_verde', expect.objectContaining({ kcal: 50, category: 'condiments' }))
    expect(service.createFood).not.toHaveBeenCalled()
    expect(food?.id).toBe('myfood_salsa_verde')
  })

  it('still creates a new food without one', async () => {
    service.updateFood.mockClear()
    const { newFood, create } = useIngredientForm('Tahini')
    newFood.value.kcal = '90'
    await create()
    expect(service.createFood).toHaveBeenCalledWith(expect.objectContaining({ name: 'Tahini', kcal: 90 }))
    expect(service.updateFood).not.toHaveBeenCalled()
  })
})
