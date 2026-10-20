import { describe, expect, it } from 'vitest'
import type { FoodItem } from '~/types/food'

const chicken: FoodItem = { id: 'c', name: 'Chicken breast, boiled', brand: 'Generic', serving: '100g', per: 100, unit: 'g', step: 10, kcal: 150, p: 30, c: 0, f: 3.2, price: 1.1 }
const egg: FoodItem = { id: 'e', name: 'Egg, boiled', brand: 'Generic', serving: '1 egg', per: 1, unit: 'piece', pieceName: 'egg', step: 1, kcal: 78, p: 6.3, c: 0.6, f: 5.3, price: 0.4 }
const tahini: FoodItem = { id: 't', name: 'Tahini', brand: 'My food', serving: '15g', per: 15, unit: 'g', step: 5, kcal: 90, p: 3, c: 3, f: 8 }

describe('scalePrice', () => {
  it('scales the price by the amount over `per`', () => {
    expect(scalePrice(chicken, 200)).toBeCloseTo(2.2)
    expect(scalePrice(egg, 3)).toBeCloseTo(1.2)
  })

  it('is null for an unpriced item', () => {
    expect(scalePrice(tahini, 30)).toBeNull()
  })
})

describe('sumPrice', () => {
  it('sums priced lines and counts the unpriced ones', () => {
    const sum = sumPrice([{ item: chicken, amount: 200 }, { item: tahini, amount: 15 }, { item: egg, amount: 2 }])
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
