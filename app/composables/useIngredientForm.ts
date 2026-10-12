import type { FoodItem, PortionUnit } from '~/types/food'
import * as foodService from '~/services/foodService'

/** The form keeps raw text so half-typed numbers like "12," survive. */
function emptyFood(name = '') {
  return { name, per: '100', unit: 'g' as PortionUnit, kcal: '', p: '', c: '', f: '' }
}

/** "a name", "a name and calories", "a name, an amount and calories". */
function joinMissing(parts: string[]) {
  return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}` : parts[0] ?? ''
}

/** State for creating a food that isn't in the catalog; saving puts it in My foods. */
export function useIngredientForm(initialName = '') {
  const newFood = ref(emptyFood(initialName))
  const creating = ref(false)

  const amount = computed(() => parseAmount(newFood.value.per, { max: AMOUNT_LIMITS[newFood.value.unit] }))
  const energy = computed(() => parseAmount(newFood.value.kcal, { integer: true, max: AMOUNT_LIMITS.kcal }))

  /** What still has to be filled in before saving, as a sentence; empty when the form is complete. */
  const missing = computed(() => {
    const parts = [
      !newFood.value.name.trim() && 'a name',
      !amount.value && 'an amount',
      !energy.value && 'calories',
    ].filter((p): p is string => !!p)
    return parts.length ? `Add ${joinMissing(parts)} to save.` : ''
  })

  /** The typed food, or null while the name, serving or calories are missing. Blank macros count as 0. */
  const parsedFood = computed(() => {
    if (missing.value) return null
    const { name, unit, p, c, f } = newFood.value
    const grams = (t: string) => parseAmount(t, { max: AMOUNT_LIMITS.g }) ?? 0
    return { name, per: amount.value!, unit, kcal: energy.value!, p: grams(p), c: grams(c), f: grams(f) }
  })

  async function create(): Promise<FoodItem | undefined> {
    if (!parsedFood.value || creating.value) return
    creating.value = true
    try {
      return await foodService.createFood(parsedFood.value)
    }
    finally {
      creating.value = false
    }
  }

  return { newFood, amount, missing, parsedFood, creating, create }
}
