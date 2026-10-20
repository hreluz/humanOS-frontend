import { describe, expect, it } from 'vitest'

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

  it('starts from the searched name', () => {
    const { missing } = useIngredientForm('Tahini')
    expect(missing.value).toBe('Add calories to save.')
  })
})
