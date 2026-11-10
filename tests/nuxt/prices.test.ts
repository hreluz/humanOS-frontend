import { describe, expect, it } from 'vitest'
import type { FoodItem } from '~/types/food'

const ingredient = (over: Partial<FoodItem>): FoodItem => ({
  id: 'x', name: 'x', serving: '100 g', per: 100, unit: 'g', step: 10, isMine: false, kcal: 0, p: 0, c: 0, f: 0, portions: [], photos: [], ...over,
})
// Prices are per 100 g.
const chicken = ingredient({ id: 'c', name: 'Chicken breast, boiled', kcal: 150, p: 30, f: 3.2, price: 1.1 })
const egg = ingredient({ id: 'e', name: 'Egg, whole, hard-boiled', kcal: 155, price: 0.8, portions: [{ key: 'large', label: '1 large egg', grams: 50 }] })
const bar = ingredient({ id: 'b', name: 'Protein bar, chocolate', isMine: true, price: 1.2, portions: [{ key: 'p_bar', label: '1 bar', grams: 45 }] })
const tahini = ingredient({ id: 't', name: 'Tahini', isMine: true, kcal: 595 })

describe('scalePrice', () => {
  it('scales the price per 100 g to the grams', () => {
    expect(scalePrice(chicken, 200)).toBeCloseTo(2.2)
  })

  it('costs a portion through its grams', () => {
    expect(scalePrice(egg, 3, 'large')).toBeCloseTo(1.2)
    expect(formatPrice(scalePrice(bar, 1, 'p_bar')!)).toBe('$0.54')
  })

  it('is null for an unpriced item', () => {
    expect(scalePrice(tahini, 30)).toBeNull()
  })
})

describe('sumPrice', () => {
  it('sums priced lines and counts the unpriced ones', () => {
    const sum = sumPrice([{ item: chicken, amount: 200 }, { item: tahini, amount: 15 }, { item: egg, amount: 2, portion: 'large' }])
    expect(sum.total).toBeCloseTo(3)
    expect(sum.unpriced).toBe(1)
  })

  it('is zero for no ingredients', () => {
    expect(sumPrice([])).toEqual({ total: 0, unpriced: 0 })
  })
})

describe('formatPrice', () => {
  it('formats as dollars with two decimals', () => {
    expect(formatPrice(2.2)).toBe('$2.20')
    expect(formatPrice(0.4)).toBe('$0.40')
    expect(formatPrice(1.1 * 3)).toBe('$3.30')
  })

  it('rounds half a cent up', () => {
    expect(formatPrice(0.005)).toBe('$0.01')
  })
})

describe('unpricedNote', () => {
  it('words the count', () => {
    expect(unpricedNote(0)).toBe('')
    expect(unpricedNote(1)).toBe('Excludes 1 ingredient without a price')
    expect(unpricedNote(2)).toBe('Excludes 2 ingredients without a price')
  })
})
