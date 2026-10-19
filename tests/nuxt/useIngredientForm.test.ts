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

  it('starts from the searched name', () => {
    const { missing } = useIngredientForm('Tahini')
    expect(missing.value).toBe('Add calories to save.')
  })
})
