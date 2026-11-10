import type { FoodItem, RecipeDraft } from '~/types/food'
import * as foodService from '~/services/foodService'

/** The recipe picker's ingredient search on the API: 3 letters minimum, debounced, latest request wins. Recipes aren't offered. */
function useIngredientSearch() {
  const query = ref('')
  const results = ref<FoodItem[] | null>(null)
  const loading = ref(false)
  const failed = ref(false)
  const needsMore = computed(() => query.value.trim().length < foodService.MIN_SEARCH_LENGTH)

  let requestId = 0
  let debounce: ReturnType<typeof setTimeout> | undefined

  async function run() {
    clearTimeout(debounce)
    const id = ++requestId
    failed.value = false
    if (needsMore.value) {
      results.value = null
      loading.value = false
      return
    }
    loading.value = true
    try {
      const found = await foodService.searchIngredients(query.value.trim())
      if (id === requestId) results.value = found
    }
    catch {
      if (id === requestId) failed.value = true
    }
    finally {
      if (id === requestId) loading.value = false
    }
  }

  watch(query, () => {
    clearTimeout(debounce)
    // Too short: clear right away; otherwise wait for a pause in typing.
    if (needsMore.value) run()
    else debounce = setTimeout(run, 200)
  })
  onBeforeUnmount(() => clearTimeout(debounce))

  return { query, results, loading, failed, needsMore, retry: run }
}

export function useRecipe() {
  const recipe = ref<RecipeDraft | null>(null)
  const pickerMode = ref<'list' | 'create'>('list')
  const { query, results, loading, failed, needsMore, retry } = useIngredientSearch()
  const saving = ref(false)

  foodService.getRecipeDraft().then((r) => { recipe.value = r })

  function changeServings(delta: number) {
    if (!recipe.value) return
    recipe.value.servings = Math.max(1, Math.min(12, recipe.value.servings + delta))
  }

  // Adding something already listed means one more step of its current unit, not a second row.
  function addIngredient(item: FoodItem) {
    const existing = recipe.value?.ingredients.find(i => i.item.id === item.id)
    if (existing) existing.amount = stepAmount(existing.amount, stepFor(existing.item, existing.portion), 1)
    else recipe.value?.ingredients.push({ item, ...startingAmount(item) })
    query.value = ''
    pickerMode.value = 'list'
  }

  function stepIngredient(index: number, dir: 1 | -1) {
    const ing = recipe.value?.ingredients[index]
    if (ing) ing.amount = stepAmount(ing.amount, stepFor(ing.item, ing.portion), dir)
  }

  /** Switches a line to grams (`null`) or one of its portions: 100 g or 1 of the portion, nothing converted. */
  function setUnit(index: number, portion: string | null) {
    const ing = recipe.value?.ingredients[index]
    if (!ing) return
    ing.amount = amountForUnit(portion)
    if (portion) ing.portion = portion
    else delete ing.portion
  }

  function removeIngredient(index: number) {
    recipe.value?.ingredients.splice(index, 1)
  }

  function startCreate() {
    pickerMode.value = 'create'
  }

  const totals = computed(() => sumMacros(recipe.value?.ingredients ?? []))

  const perServing = computed(() => {
    const servings = recipe.value?.servings ?? 1
    const { kcal, p, c, f } = totals.value
    return { kcal: Math.round(kcal / servings), p: Math.round(p / servings), c: Math.round(c / servings), f: Math.round(f / servings) }
  })

  // The recipe's cost; null while no ingredient has a price. Rounding happens only in formatPrice.
  const cost = computed(() => {
    const ingredients = recipe.value?.ingredients ?? []
    const { total, unpriced } = sumPrice(ingredients)
    if (unpriced === ingredients.length) return null
    return { total, perServing: total / (recipe.value?.servings ?? 1), unpriced }
  })

  const canSave = computed(() => !!recipe.value?.name.trim() && recipe.value.ingredients.length > 0)
  const saveHint = computed(() => {
    if (!recipe.value || canSave.value) return ''
    const noName = !recipe.value.name.trim()
    const noIngredients = !recipe.value.ingredients.length
    if (noName && noIngredients) return 'Add a name and an ingredient to save.'
    return noName ? 'Add a name to save.' : 'Add an ingredient to save.'
  })

  async function save() {
    if (!recipe.value || !canSave.value) return
    saving.value = true
    try {
      await foodService.saveRecipe(recipe.value)
      await navigateTo('/food')
    }
    finally {
      saving.value = false
    }
  }

  return {
    recipe, query, results, loading, failed, needsMore, retry, pickerMode, saving, canSave, saveHint, totals, perServing, cost,
    changeServings, addIngredient, stepIngredient, setUnit, removeIngredient, startCreate, save,
  }
}
