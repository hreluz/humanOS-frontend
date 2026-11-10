import type { FoodItem, IngredientCategory, NewFoodInput } from '~/types/food'
import * as foodService from '~/services/foodService'

/** Per 100 g, as the API checks them. */
const MAX_KCAL = 900
const MAX_GRAMS = 100
const MAX_PORTION_GRAMS = 5000
export const MAX_PORTIONS = 10

interface PortionRow { key?: string, label: string, grams: string }

/** The form keeps raw text so half-typed numbers like "12," survive. */
function emptyFood(name = '') {
  return { name, category: '' as IngredientCategory | '', kcal: '', p: '', c: '', f: '', fiber: '', price: '', portions: [] as PortionRow[] }
}

type FoodForm = ReturnType<typeof emptyFood>

/** A saved food as form text, for editing it. Portions keep their `key` so the edit updates them instead of replacing them. */
function foodToForm(food: FoodItem): FoodForm {
  const { name, kcal, p, c, f, fiber, price, category, portions } = food
  return {
    name, category: category ?? '', kcal: String(kcal), p: String(p), c: String(c), f: String(f),
    fiber: fiber === null || fiber === undefined ? '' : String(fiber),
    price: price === undefined ? '' : price.toFixed(2),
    portions: portions.map(({ key, label, grams }) => ({ key, label, grams: String(grams) })),
  }
}

/** Grams typed in a field, clamped to `max`; 0 is a valid amount here. Null for blank or non-numeric text. */
function parseGrams(text: string, max: number) {
  const t = text.trim()
  if (!t) return null
  return parseAmount(t, { max }) ?? (/^0*[.,]?0*$/.test(t) ? 0 : null)
}

/** "a name", "a name and calories", "a name, a category and calories". */
function joinMissing(parts: string[]) {
  return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}` : parts[0] ?? ''
}

/** State for creating a food that isn't in the catalog, or for editing one of the user's own (`editing`); saving puts it in My foods. */
export function useIngredientForm(initialName = '', editing?: FoodItem) {
  const newFood = ref<FoodForm>(editing ? foodToForm(editing) : emptyFood(initialName))
  const creating = ref(false)
  const fieldErrors = ref<Record<string, string | undefined>>({})
  const formError = ref('')

  const energy = computed(() => parseAmount(newFood.value.kcal, { integer: true, max: MAX_KCAL }))
  const price = computed(() => parseAmount(newFood.value.price, { decimals: 2, max: AMOUNT_LIMITS.price }))
  /** The price is optional, so only typed text that isn't a price counts as invalid. */
  const priceInvalid = computed(() => newFood.value.price.trim() !== '' && !price.value)
  const macros = computed(() => ({
    p: parseGrams(newFood.value.p, MAX_GRAMS) ?? 0,
    c: parseGrams(newFood.value.c, MAX_GRAMS) ?? 0,
    f: parseGrams(newFood.value.f, MAX_GRAMS) ?? 0,
  }))
  /** Protein, carbs and fat can't weigh more than the 100 g they're for. Fiber is outside the sum, as in the API. */
  const sumInvalid = computed(() => macros.value.p + macros.value.c + macros.value.f > MAX_GRAMS)
  const portions = computed(() => newFood.value.portions.map(row => ({
    key: row.key, label: row.label.trim(), grams: parseAmount(row.grams, { max: MAX_PORTION_GRAMS }),
  })))
  const portionsIncomplete = computed(() => portions.value.some(p => !p.label || !p.grams))

  /** What still has to be filled in before saving, as a sentence; empty when the form is complete. */
  const missing = computed(() => {
    const parts = [
      !newFood.value.name.trim() && 'a name',
      !newFood.value.category && 'a category',
      !energy.value && 'calories',
      portionsIncomplete.value && 'complete portions',
      priceInvalid.value && 'a valid price',
    ].filter((p): p is string => !!p)
    return parts.length ? `Add ${joinMissing(parts)} to save.` : ''
  })

  /** The typed food, or null while something is missing or the macros add up to more than 100 g. Blank macros count as 0, a blank fiber is `null`. */
  const parsedFood = computed((): NewFoodInput | null => {
    if (missing.value || sumInvalid.value || !newFood.value.category) return null
    const food: NewFoodInput = {
      name: newFood.value.name.trim(),
      category: newFood.value.category,
      kcal: energy.value!,
      ...macros.value,
      fiber: parseGrams(newFood.value.fiber, MAX_GRAMS),
      portions: portions.value.map(({ key, label, grams }) => ({ ...key && { key }, label, grams: grams! })),
    }
    if (price.value) food.price = price.value
    return food
  })

  function addPortion() {
    if (newFood.value.portions.length < MAX_PORTIONS) newFood.value.portions.push({ label: '', grams: '' })
  }

  function removePortion(index: number) {
    newFood.value.portions.splice(index, 1)
  }

  /** Saves to the API. A 422 puts its messages under the fields; any other failure sets `formError`. The typed values stay either way. */
  async function save(): Promise<FoodItem | undefined> {
    if (!parsedFood.value || creating.value) return
    creating.value = true
    fieldErrors.value = {}
    formError.value = ''
    try {
      return editing
        ? await foodService.updateFood(editing.id, parsedFood.value)
        : await foodService.createFood(parsedFood.value)
    }
    catch (err) {
      const fields = toFieldErrors(err, { protein: 'p', carbs: 'c', fat: 'f' })
      if (!fields) {
        formError.value = toFormMessage(err)
        return
      }
      const errors: Record<string, string | undefined> = {}
      for (const [key, message] of Object.entries(fields)) {
        const field = key.startsWith('portions') ? 'portions' : key
        errors[field] ??= message
      }
      fieldErrors.value = errors
    }
    finally {
      creating.value = false
    }
  }

  return { newFood, missing, sumInvalid, priceInvalid, parsedFood, creating, fieldErrors, formError, addPortion, removePortion, save, create: save }
}
