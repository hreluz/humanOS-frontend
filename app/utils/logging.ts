import type { ActivityDef, ActivityUnit } from '~/types/activity'
import type { FoodItem, Macros, MealKey, PortionUnit } from '~/types/food'

const round1 = (n: number) => Math.round(n * 10) / 10
const num = (n: number) => round1(n).toLocaleString('en-US')

/** Macros for `amount` of `item`, in the item's unit. */
export function scaleFood(item: FoodItem, amount: number): Macros {
  const k = amount / item.per
  return { kcal: Math.round(item.kcal * k), p: round1(item.p * k), c: round1(item.c * k), f: round1(item.f * k) }
}

/** The unit word shown after an amount: "g", "ml", "egg"/"eggs", "serving"/"servings". */
export function portionUnit(item: FoodItem, amount: number) {
  if (item.unit === 'g' || item.unit === 'ml') return item.unit
  const name = item.unit === 'serving' ? 'serving' : item.pieceName ?? 'piece'
  return amount === 1 ? name : `${name}s`
}

/** "100 g", "250 ml", "2 eggs", "1 serving". */
export function formatPortion(item: FoodItem, amount: number) {
  return `${num(amount)} ${portionUnit(item, amount)}`
}

/** Highest amount accepted per unit, so a stray keystroke can't log 50 kg of rice. */
export const AMOUNT_LIMITS: Record<PortionUnit | ActivityUnit | 'kcal', number> = {
  g: 5000, ml: 5000, piece: 50, serving: 50, min: 600, steps: 100000, kcal: 5000,
}

/**
 * Parses a typed amount: "96", "96.5", "96,5", "1,001". A comma followed by exactly three digits is a
 * thousands separator, otherwise a decimal comma. Returns null for empty, zero or non-numeric input.
 */
export function parseAmount(text: string, { integer = false, max = Infinity }: { integer?: boolean, max?: number } = {}) {
  const t = text.trim().replace(/\s/g, '').replace(/,(?=\d{3}(?!\d))/g, '').replace(',', '.')
  if (!/^\d*\.?\d+$|^\d+\.$/.test(t)) return null
  const n = integer ? Math.round(+t) : round1(+t)
  return n > 0 ? Math.min(n, max) : null
}

/** Calories burned: MET × kg × hours for timed activities, ~0.0005 kcal per kg per step for walking. */
export function burnedKcal(def: ActivityDef, amount: number, kg: number) {
  return Math.round(def.unit === 'steps' ? amount * 0.0005 * kg : def.met * kg * (amount / 60))
}

/** "15 min", "1,000 steps". */
export function formatActivityAmount(unit: string, amount: number) {
  return `${num(amount)} ${unit}`
}

/** The meal a log most likely belongs to at a given hour of the day. */
export function mealForHour(hour: number): MealKey {
  if (hour >= 5 && hour < 11) return 'breakfast'
  if (hour >= 11 && hour < 16) return 'lunch'
  if (hour >= 16 && hour < 21) return 'dinner'
  return 'snacks'
}

/** Next stepper value, never below one step. */
export function stepAmount(amount: number, step: number, dir: 1 | -1) {
  return Math.max(step, round1(amount + dir * step))
}
