import type { ActivityDef, ActivityUnit } from '~/types/activity'
import type { FoodItem, FoodLogEntry, Macros, MealKey, NewFoodInput, PortionUnit, RecipeIngredient } from '~/types/food'

const round1 = (n: number) => Math.round(n * 10) / 10
const num = (n: number) => round1(n).toLocaleString('en-US')

/** Macros for `amount` of `item`, in the item's unit. */
export function scaleFood(item: FoodItem, amount: number): Macros {
  const k = amount / item.per
  return { kcal: Math.round(item.kcal * k), p: round1(item.p * k), c: round1(item.c * k), f: round1(item.f * k) }
}

/** Total macros of a list of ingredients. */
export function sumMacros(ingredients: RecipeIngredient[]): Macros {
  const sum = ingredients.map(i => scaleFood(i.item, i.amount))
    .reduce((a, m) => ({ kcal: a.kcal + m.kcal, p: a.p + m.p, c: a.c + m.c, f: a.f + m.f }), { kcal: 0, p: 0, c: 0, f: 0 })
  return { kcal: Math.round(sum.kcal), p: round1(sum.p), c: round1(sum.c), f: round1(sum.f) }
}

/** A recipe's ingredients scaled to `servings` of it; empty for anything that isn't a recipe. */
export function recipePortion(item: FoodItem, servings: number): RecipeIngredient[] {
  if (!item.recipe) return []
  const k = servings / item.recipe.servings
  return item.recipe.ingredients.map(i => ({ item: i.item, amount: round1(i.amount * k) }))
}

/** Macros of a basket line: from its ingredients when it's a recipe, else from the amount. */
export function entryMacros(entry: FoodLogEntry): Macros {
  return entry.ingredients ? sumMacros(entry.ingredients) : scaleFood(entry.item, entry.amount)
}

/** "+20 g", "−1 egg"; empty when unchanged. */
export function formatAmountChange(item: FoodItem, from: number, to: number) {
  const d = round1(to - from)
  if (!d) return ''
  return `${d > 0 ? '+' : '−'}${formatPortion(item, Math.abs(d))}`
}

/** True when every word of `query` appears in `name`; an empty query matches everything. */
export function matchesQuery(name: string, query: string) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  return words.every(w => name.toLowerCase().includes(w))
}

/** A user-created food, with the stepper sized to its unit. */
export function buildFood(input: NewFoodInput, id: string): FoodItem {
  const { name, per, unit, kcal, p, c, f, price, category } = input
  const food: FoodItem = { id, name: name.trim(), brand: 'My food', serving: '', per, unit, step: unit === 'g' || unit === 'ml' ? 10 : 1, kcal, p, c, f }
  if (price !== undefined) food.price = price
  if (category !== undefined) food.category = category
  return { ...food, serving: formatPortion(food, per) }
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
export const AMOUNT_LIMITS: Record<PortionUnit | ActivityUnit | 'kcal' | 'price', number> = {
  g: 5000, ml: 5000, piece: 50, serving: 50, min: 600, steps: 100000, kcal: 5000, price: 1000,
}

/**
 * Parses a typed amount: "96", "96.5", "96,5", "1,001". A comma followed by exactly three digits is a
 * thousands separator, otherwise a decimal comma. Returns null for empty, zero or non-numeric input.
 */
export function parseAmount(text: string, { integer = false, max = Infinity, decimals = 1 }: { integer?: boolean, max?: number, decimals?: number } = {}) {
  const t = text.trim().replace(/\s/g, '').replace(/,(?=\d{3}(?!\d))/g, '').replace(',', '.')
  if (!/^\d*\.?\d+$|^\d+\.$/.test(t)) return null
  const k = 10 ** decimals
  const n = integer ? Math.round(+t) : Math.round(+t * k) / k
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

/** Next stepper value, never below one step (or below an amount already smaller than a step, like half an avocado). */
export function stepAmount(amount: number, step: number, dir: 1 | -1) {
  return Math.max(Math.min(step, amount), round1(amount + dir * step))
}

/** Local midnight of `d`. */
export function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/** True when both times fall on the same local calendar day. */
export function isSameDay(a: Date | string, b: Date | string) {
  return startOfDay(new Date(a)).getTime() === startOfDay(new Date(b)).getTime()
}

/** The last `count` days as local midnights, today first. */
export function recentDays(now: Date, count = 7): Date[] {
  return Array.from({ length: count }, (_, i) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - i))
}

/** "HH:MM" (24h), the value format of `<input type="time">`. */
export function toTimeValue(d: Date) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** `day` at the "HH:MM" time; an unparseable time keeps midnight. */
export function combineDayTime(day: Date, hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number)
  const d = startOfDay(day)
  if (Number.isFinite(h) && Number.isFinite(m)) d.setHours(h!, m!)
  return d
}

/** "Today", "Yesterday", "Sat, Oct 10". */
export function formatDayLabel(day: Date | string, now: Date) {
  if (isSameDay(day, now)) return 'Today'
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
  if (isSameDay(day, yesterday)) return 'Yesterday'
  return new Date(day).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

/** "2:45 PM". */
export const formatLogTime = (iso: Date | string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

/** "Today, 2:45 PM", "Yesterday, 9:10 AM", "Sat, Oct 10, 9:10 AM". */
export function formatLogWhen(at: Date | string, now: Date) {
  return `${formatDayLabel(at, now)}, ${formatLogTime(at)}`
}
