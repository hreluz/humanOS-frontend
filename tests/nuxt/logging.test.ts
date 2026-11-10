import { describe, expect, it } from 'vitest'
import type { ActivityDef } from '~/types/activity'
import type { FoodItem } from '~/types/food'
import type { Goal } from '~/types/goal'

const ingredient = (over: Partial<FoodItem>): FoodItem => ({
  id: 'x', name: 'x', serving: '100 g', per: 100, unit: 'g', step: 10, isMine: false, kcal: 0, p: 0, c: 0, f: 0, portions: [], photos: [], ...over,
})
const chicken = ingredient({ id: 'c', name: 'Chicken breast, boiled', kcal: 150, p: 30, c: 0, f: 3.2 })
const egg = ingredient({
  id: 'e', name: 'Egg, whole, hard-boiled', kcal: 155, p: 12.6, c: 1.12, f: 10.6,
  portions: [{ key: 'large', label: '1 large egg', grams: 50 }, { key: 'cup_chopped', label: '1 cup, chopped', grams: 136 }],
})
const avocado = ingredient({ id: 'a', name: 'Avocado', kcal: 160, p: 2, c: 8.53, f: 14.7, portions: [{ key: 'whole', label: '1 avocado', grams: 201 }] })
const cycling: ActivityDef = { key: 'cycling', label: 'Cycling', icon: '', met: 7.5, unit: 'min', defaultAmount: 15, step: 5 }
const walking: ActivityDef = { key: 'walking', label: 'Walking', icon: '', met: 3.5, unit: 'steps', defaultAmount: 1000, step: 500 }

describe('scaleFood', () => {
  it('scales macros per 100 g to the grams eaten', () => {
    expect(scaleFood(chicken, 150)).toEqual({ kcal: 225, p: 45, c: 0, f: 4.8 })
  })

  it('scales a count of a portion through its grams', () => {
    expect(scaleFood(egg, 2, 'large')).toEqual({ kcal: 155, p: 12.6, c: 1.1, f: 10.6 })
  })
})

describe('gramsOf', () => {
  it('multiplies a portion count by its grams, and passes grams through', () => {
    expect(gramsOf(egg, 2, 'large')).toBe(100)
    expect(gramsOf(avocado, 0.5, 'whole')).toBe(100.5)
    expect(gramsOf(chicken, 150)).toBe(150)
    expect(gramsOf(chicken, 150, 'nope')).toBe(150)
  })
})

describe('formatPortion', () => {
  it('formats grams, portions and servings', () => {
    expect(formatPortion(chicken, 150)).toBe('150 g')
    expect(formatPortion(egg, 2, 'large')).toBe('2 × 1 large egg (100 g)')
    expect(formatPortion(avocado, 0.5, 'whole')).toBe('0.5 × 1 avocado (100.5 g)')
    expect(formatPortion({ ...chicken, unit: 'serving', per: 1 }, 1)).toBe('1 serving')
    expect(formatPortion({ ...chicken, unit: 'serving', per: 1 }, 2)).toBe('2 servings')
  })
})

describe('portionUnit', () => {
  it('names grams, servings and portions', () => {
    expect(portionUnit(chicken, 96)).toBe('g')
    expect(portionUnit({ ...chicken, unit: 'serving', per: 1 }, 1)).toBe('serving')
    expect(portionUnit({ ...chicken, unit: 'serving', per: 1 }, 3)).toBe('servings')
    expect(portionUnit(egg, 2, 'large')).toBe('× 1 large egg')
  })
})

describe('starting amounts and units', () => {
  it('starts at 1 × the first portion, or 100 g without portions', () => {
    expect(startingAmount(egg)).toEqual({ amount: 1, portion: 'large' })
    expect(startingAmount(chicken)).toEqual({ amount: 100 })
  })

  it('resets to 1 of a portion or 100 g when the unit changes', () => {
    expect(amountForUnit('large')).toBe(1)
    expect(amountForUnit(null)).toBe(100)
  })

  it('steps by 1 in portions and by the item\'s step in grams', () => {
    expect(stepFor(egg, 'large')).toBe(1)
    expect(stepFor(egg)).toBe(10)
  })

  it('shows the picker only for ingredients with portions', () => {
    expect(hasUnitPicker(egg)).toBe(true)
    expect(hasUnitPicker(chicken)).toBe(false)
    expect(stepperUnit(egg, 1, 'large')).toBe('×')
    expect(stepperUnit(egg, 100)).toBe('')
    expect(stepperUnit(chicken, 100)).toBe('g')
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
  const bowl = ingredient({
    id: 'bowl', name: 'Chicken & egg bowl', serving: '1 serving', per: 1, unit: 'serving', step: 1, isMine: true, kcal: 303, p: 36, c: 1, f: 8,
    recipe: { servings: 2, ingredients: [{ item: chicken, amount: 300 }, { item: egg, amount: 2, portion: 'large' }] },
  })

  it('sums ingredient macros, portions included', () => {
    expect(sumMacros([{ item: chicken, amount: 150 }, { item: egg, amount: 2, portion: 'large' }])).toEqual({ kcal: 380, p: 57.6, c: 1.1, f: 15.4 })
    expect(sumMacros([])).toEqual({ kcal: 0, p: 0, c: 0, f: 0 })
  })

  it('scales a recipe to the servings eaten and keeps each line\'s portion', () => {
    expect(recipePortion(bowl, 1)).toEqual([{ item: chicken, amount: 150 }, { item: egg, amount: 1, portion: 'large' }])
    expect(recipePortion(bowl, 3)).toEqual([{ item: chicken, amount: 450 }, { item: egg, amount: 3, portion: 'large' }])
    expect(recipePortion(chicken, 1)).toEqual([])
  })

  it('takes a recipe entry\'s macros from its ingredients, and a plain entry\'s from its portion', () => {
    expect(entryMacros({ item: bowl, amount: 1, ingredients: [{ item: chicken, amount: 200 }] })).toEqual(scaleFood(chicken, 200))
    expect(entryMacros({ item: chicken, amount: 150 })).toEqual(scaleFood(chicken, 150))
    expect(entryMacros({ item: egg, amount: 2, portion: 'large' }).kcal).toBe(155)
  })

  it('formats how far an amount moved from the recipe', () => {
    expect(formatAmountChange(chicken, 150, 170)).toBe('+20 g')
    expect(formatAmountChange(egg, 2, 1, 'large')).toBe('−1 × 1 large egg (50 g)')
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
