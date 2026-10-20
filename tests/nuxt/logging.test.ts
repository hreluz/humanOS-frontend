import { describe, expect, it } from 'vitest'
import type { ActivityDef } from '~/types/activity'
import type { FoodItem } from '~/types/food'
import type { Goal } from '~/types/goal'

const chicken: FoodItem = { id: 'c', name: 'Chicken breast, boiled', brand: 'Generic', serving: '100g', per: 100, unit: 'g', step: 10, kcal: 150, p: 30, c: 0, f: 3.2 }
const egg: FoodItem = { id: 'e', name: 'Egg, boiled', brand: 'Generic', serving: '1 egg', per: 1, unit: 'piece', pieceName: 'egg', step: 1, kcal: 78, p: 6.3, c: 0.6, f: 5.3 }
const cycling: ActivityDef = { key: 'cycling', label: 'Cycling', icon: '', met: 7.5, unit: 'min', defaultAmount: 15, step: 5 }
const walking: ActivityDef = { key: 'walking', label: 'Walking', icon: '', met: 3.5, unit: 'steps', defaultAmount: 1000, step: 500 }

describe('scaleFood', () => {
  it('scales macros to the amount eaten', () => {
    expect(scaleFood(chicken, 150)).toEqual({ kcal: 225, p: 45, c: 0, f: 4.8 })
    expect(scaleFood(egg, 2)).toEqual({ kcal: 156, p: 12.6, c: 1.2, f: 10.6 })
  })
})

describe('formatPortion', () => {
  it('formats by unit', () => {
    expect(formatPortion(chicken, 100)).toBe('100 g')
    expect(formatPortion(egg, 1)).toBe('1 egg')
    expect(formatPortion(egg, 2)).toBe('2 eggs')
    expect(formatPortion({ ...chicken, unit: 'serving', per: 1 }, 1)).toBe('1 serving')
  })
})

describe('portionUnit', () => {
  it('pluralises pieces and servings, not weights', () => {
    expect(portionUnit(chicken, 96)).toBe('g')
    expect(portionUnit(egg, 1)).toBe('egg')
    expect(portionUnit(egg, 3)).toBe('eggs')
  })
})

describe('parseAmount', () => {
  it('reads typed amounts', () => {
    expect(parseAmount('96')).toBe(96)
    expect(parseAmount(' 96.5 ')).toBe(96.5)
    expect(parseAmount('96,5')).toBe(96.5)
    expect(parseAmount('1,001')).toBe(1001)
    expect(parseAmount('.5')).toBe(0.5)
  })

  it('rejects empty, zero and non-numeric input', () => {
    for (const t of ['', '0', 'abc', '-5', '1.2.3']) expect(parseAmount(t)).toBeNull()
  })

  it('rounds integers and caps at max', () => {
    expect(parseAmount('2.6', { integer: true })).toBe(3)
    expect(parseAmount('0.2', { integer: true })).toBeNull()
    expect(parseAmount('250000', { max: AMOUNT_LIMITS.steps })).toBe(100000)
  })

  it('rounds to 1 decimal by default', () => {
    expect(parseAmount('1.26')).toBe(1.3)
  })

  it('rounds to the given decimals', () => {
    const price = (t: string) => parseAmount(t, { decimals: 2, max: AMOUNT_LIMITS.price })
    expect(price('1.155')).toBe(1.16)
    expect(price('1,5')).toBe(1.5)
    expect(price('1.50')).toBe(1.5)
    expect(price('0')).toBeNull()
    expect(price('5000')).toBe(1000)
  })
})

describe('burnedKcal', () => {
  it('uses MET × kg × hours for timed activities', () => {
    expect(burnedKcal(cycling, 15, 82.1)).toBe(154)
  })

  it('uses a per-step estimate for walking', () => {
    expect(burnedKcal(walking, 1000, 82.1)).toBe(41)
  })
})

describe('mealForHour', () => {
  it('picks the meal for the time of day', () => {
    expect(mealForHour(8)).toBe('breakfast')
    expect(mealForHour(13)).toBe('lunch')
    expect(mealForHour(19)).toBe('dinner')
    expect(mealForHour(23)).toBe('snacks')
    expect(mealForHour(2)).toBe('snacks')
  })
})

describe('stepAmount', () => {
  it('never goes below one step', () => {
    expect(stepAmount(10, 10, -1)).toBe(10)
    expect(stepAmount(0.5, 0.25, 1)).toBe(0.8) // rounds to one decimal
  })

  it('keeps an amount already under one step when stepping down', () => {
    expect(stepAmount(0.5, 1, -1)).toBe(0.5)
    expect(stepAmount(0.5, 1, 1)).toBe(1.5)
  })
})

describe('recipes', () => {
  const bowl: FoodItem = {
    id: 'bowl', name: 'Chicken & egg bowl', brand: 'Custom recipe', serving: '1 serving', per: 1, unit: 'serving', step: 1, kcal: 303, p: 36, c: 1, f: 8,
    recipe: { servings: 2, ingredients: [{ item: chicken, amount: 300 }, { item: egg, amount: 2 }] },
  }

  it('sums ingredient macros', () => {
    expect(sumMacros([{ item: chicken, amount: 150 }, { item: egg, amount: 2 }])).toEqual({ kcal: 381, p: 57.6, c: 1.2, f: 15.4 })
    expect(sumMacros([])).toEqual({ kcal: 0, p: 0, c: 0, f: 0 })
  })

  it('scales a recipe to the servings eaten', () => {
    expect(recipePortion(bowl, 1)).toEqual([{ item: chicken, amount: 150 }, { item: egg, amount: 1 }])
    expect(recipePortion(bowl, 3)).toEqual([{ item: chicken, amount: 450 }, { item: egg, amount: 3 }])
    expect(recipePortion(chicken, 1)).toEqual([])
  })

  it('takes a recipe entry\'s macros from its ingredients', () => {
    expect(entryMacros({ item: bowl, amount: 1, ingredients: [{ item: chicken, amount: 200 }] })).toEqual(scaleFood(chicken, 200))
    expect(entryMacros({ item: chicken, amount: 150 })).toEqual(scaleFood(chicken, 150))
  })

  it('formats how far an amount moved from the recipe', () => {
    expect(formatAmountChange(chicken, 150, 170)).toBe('+20 g')
    expect(formatAmountChange(egg, 2, 1)).toBe('−1 egg')
    expect(formatAmountChange(chicken, 150, 150)).toBe('')
  })
})

describe('dailyGoalProgress', () => {
  const totals = { protein: 118, kcal: 1360, steps: 6200, activeKcal: 341, waterMl: 1750 }
  const goal = (g: Partial<Goal>): Goal => ({ id: 'g', label: '', sub: 'stored', pct: 50, accent: 'blue', ...g })

  it('computes progress from today for daily goals', () => {
    expect(dailyGoalProgress(goal({ metric: 'protein', target: 170 }), totals)).toEqual({ pct: 69, sub: '118g today' })
    expect(dailyGoalProgress(goal({ metric: 'waterMl', target: 3000 }), totals)).toEqual({ pct: 58, sub: '1.8L today' })
    expect(dailyGoalProgress(goal({ metric: 'steps', target: 5000 }), totals).pct).toBe(100)
  })

  it('keeps stored progress for other goals', () => {
    expect(dailyGoalProgress(goal({}), totals)).toEqual({ pct: 50, sub: 'stored' })
  })
})

describe('buildFood', () => {
  it('builds a user food with a serving label and unit-sized step', () => {
    const tahini = buildFood({ name: ' Tahini ', per: 15, unit: 'g', kcal: 90, p: 2.6, c: 3.2, f: 8 }, 't')
    expect(tahini).toEqual({ id: 't', name: 'Tahini', brand: 'My food', serving: '15 g', per: 15, unit: 'g', step: 10, kcal: 90, p: 2.6, c: 3.2, f: 8 })
    expect(buildFood({ name: 'Wrap', per: 1, unit: 'piece', kcal: 140, p: 4, c: 24, f: 3 }, 'w')).toMatchObject({ serving: '1 piece', step: 1 })
  })

  it('keeps a typed price and adds no price key without one', () => {
    expect(buildFood({ name: 'Tahini', per: 100, unit: 'g', kcal: 595, p: 17, c: 21, f: 54, price: 2.5 }, 't').price).toBe(2.5)
    expect(buildFood({ name: 'Tahini', per: 100, unit: 'g', kcal: 595, p: 17, c: 21, f: 54 }, 't')).not.toHaveProperty('price')
  })

  it('keeps a picked category and adds no category key without one', () => {
    expect(buildFood({ name: 'Tahini', per: 100, unit: 'g', kcal: 595, p: 17, c: 21, f: 54, category: 'fats' }, 't').category).toBe('fats')
    expect(buildFood({ name: 'Tahini', per: 100, unit: 'g', kcal: 595, p: 17, c: 21, f: 54 }, 't')).not.toHaveProperty('category')
  })
})

describe('matchesQuery', () => {
  it('matches every word in any order, ignoring case', () => {
    expect(matchesQuery('Chicken breast, grilled', 'GRILLED chicken')).toBe(true)
    expect(matchesQuery('Chicken breast, grilled', 'chicken thigh')).toBe(false)
    expect(matchesQuery('Anything', '  ')).toBe(true)
  })
})

describe('log time', () => {
  const now = new Date(2026, 9, 12, 14, 45)

  it('lists the last days as local midnights, today first', () => {
    const days = recentDays(now, 3)
    expect(days.map(d => [d.getMonth(), d.getDate(), d.getHours()])).toEqual([[9, 12, 0], [9, 11, 0], [9, 10, 0]])
    expect(recentDays(new Date(2026, 2, 1, 9), 2)[1]!.getDate()).toBe(28)
  })

  it('combines a day with an input time', () => {
    expect(combineDayTime(new Date(2026, 9, 11, 23, 59), '08:05')).toEqual(new Date(2026, 9, 11, 8, 5))
    expect(combineDayTime(new Date(2026, 9, 11, 5), '')).toEqual(new Date(2026, 9, 11))
    expect(toTimeValue(new Date(2026, 9, 11, 7, 3))).toBe('07:03')
  })

  it('compares calendar days, not 24-hour spans', () => {
    expect(isSameDay(new Date(2026, 9, 12, 0, 0), new Date(2026, 9, 12, 23, 59))).toBe(true)
    expect(isSameDay(new Date(2026, 9, 11, 23, 59), new Date(2026, 9, 12, 0, 1))).toBe(false)
  })

  it('names the day relative to now', () => {
    expect(formatLogWhen(new Date(2026, 9, 12, 14, 45), now)).toBe('Today, 2:45 PM')
    expect(formatLogWhen(new Date(2026, 9, 11, 21, 10), now)).toBe('Yesterday, 9:10 PM')
    expect(formatLogWhen(new Date(2026, 9, 10, 9, 10), now)).toBe('Sat, Oct 10, 9:10 AM')
  })
})
