import type { FoodItem, IngredientCategory, NewFoodInput, PortionUnit } from '~/types/food'
import * as foodService from '~/services/foodService'

/** The form keeps raw text so half-typed numbers like "12," survive. */
function emptyFood(name = '') {
  return { name, per: '100', unit: 'g' as PortionUnit, kcal: '', p: '', c: '', f: '', price: '', category: '' as IngredientCategory | '' }
}

/** A saved food as form text, for editing it. */
function foodToForm(food: FoodItem): ReturnType<typeof emptyFood> {
  const { name, per, unit, kcal, p, c, f, price, category } = food
  return { name, per: String(per), unit, kcal: String(kcal), p: String(p), c: String(c), f: String(f), price: price === undefined ? '' : price.toFixed(2), category: category ?? '' }
}

/** "a name", "a name and calories", "a name, an amount and calories". */
function joinMissing(parts: string[]) {
  return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}` : parts[0] ?? ''
}

/** State for creating a food that isn't in the catalog, or for editing one of the user's own (`editing`); saving puts it in My foods. */
export function useIngredientForm(initialName = '', editing?: FoodItem) {
  const newFood = ref(editing ? foodToForm(editing) : emptyFood(initialName))
  const creating = ref(false)

  const amount = computed(() => parseAmount(newFood.value.per, { max: AMOUNT_LIMITS[newFood.value.unit] }))
  const energy = computed(() => parseAmount(newFood.value.kcal, { integer: true, max: AMOUNT_LIMITS.kcal }))
  const price = computed(() => parseAmount(newFood.value.price, { decimals: 2, max: AMOUNT_LIMITS.price }))
  /** The price is optional, so only typed text that isn't a price counts as invalid. */
  const priceInvalid = computed(() => newFood.value.price.trim() !== '' && !price.value)

  /** What still has to be filled in before saving, as a sentence; empty when the form is complete. */
  const missing = computed(() => {
    const parts = [
      !newFood.value.name.trim() && 'a name',
      !amount.value && 'an amount',
      !energy.value && 'calories',
      priceInvalid.value && 'a valid price',
    ].filter((p): p is string => !!p)
    return parts.length ? `Add ${joinMissing(parts)} to save.` : ''
  })

  /** The typed food, or null while the name, serving or calories are missing. Blank macros count as 0; a blank price or category is left out. */
  const parsedFood = computed((): NewFoodInput | null => {
    if (missing.value) return null
    const { name, unit, p, c, f, category } = newFood.value
    const grams = (t: string) => parseAmount(t, { max: AMOUNT_LIMITS.g }) ?? 0
    const food: NewFoodInput = { name, per: amount.value!, unit, kcal: energy.value!, p: grams(p), c: grams(c), f: grams(f) }
    if (price.value) food.price = price.value
    if (category) food.category = category
    return food
  })

  async function save(): Promise<FoodItem | undefined> {
    if (!parsedFood.value || creating.value) return
    creating.value = true
    try {
      return editing
        ? await foodService.updateFood(editing.id, parsedFood.value)
        : await foodService.createFood(parsedFood.value)
    }
    finally {
      creating.value = false
    }
  }

  return { newFood, amount, priceInvalid, missing, parsedFood, creating, save, create: save }
}
