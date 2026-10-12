import type { FoodItem, PortionUnit } from '~/types/food'
import * as foodService from '~/services/foodService'

/** The form keeps raw text so half-typed numbers like "12," survive. */
function emptyFood(name = '') {
  return { name, per: '100', unit: 'g' as PortionUnit, kcal: '', p: '', c: '', f: '' }
}

/** State for creating a food that isn't in the catalog; saving puts it in My foods. */
export function useIngredientForm(initialName = '') {
  const newFood = ref(emptyFood(initialName))
  const creating = ref(false)

  /** The typed food, or null while the name, serving or calories are missing. Blank macros count as 0. */
  const parsedFood = computed(() => {
    const { name, per, unit, kcal, p, c, f } = newFood.value
    const amount = parseAmount(per, { max: AMOUNT_LIMITS[unit] })
    const energy = parseAmount(kcal, { integer: true, max: AMOUNT_LIMITS.kcal })
    if (!name.trim() || !amount || !energy) return null
    const grams = (t: string) => parseAmount(t, { max: AMOUNT_LIMITS.g }) ?? 0
    return { name, per: amount, unit, kcal: energy, p: grams(p), c: grams(c), f: grams(f) }
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

  return { newFood, parsedFood, creating, create }
}
