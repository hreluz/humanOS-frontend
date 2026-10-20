import type { FoodItem, RecipeIngredient } from '~/types/food'

/** Priced total of a list of ingredients, and how many had no price. */
export interface PriceSum {
  total: number
  unpriced: number
}

/** Cost of `amount` of `item`, in the item's unit; null when the item has no price. Not rounded. */
export function scalePrice(item: FoodItem, amount: number): number | null {
  return item.price === undefined ? null : item.price * amount / item.per
}

/** Sum of the priced lines (unrounded), and how many lines had no price. */
export function sumPrice(ingredients: RecipeIngredient[]): PriceSum {
  return ingredients.reduce((sum, i) => {
    const cost = scalePrice(i.item, i.amount)
    return cost === null ? { ...sum, unpriced: sum.unpriced + 1 } : { ...sum, total: sum.total + cost }
  }, { total: 0, unpriced: 0 })
}

/** "$1.10"; rounds to cents once, here. */
export function formatPrice(n: number): string {
  const cents = Math.round((n + Number.EPSILON) * 100) / 100
  return cents.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

/** "Excludes 2 ingredients without a price"; empty when everything is priced. */
export function unpricedNote(count: number): string {
  if (!count) return ''
  return `Excludes ${count} ${count === 1 ? 'ingredient' : 'ingredients'} without a price`
}
