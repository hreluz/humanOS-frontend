import type { FoodItem, RecipeDraft } from '~/types/food'
import * as foodService from '~/services/foodService'

export function useRecipe() {
  const recipe = ref<RecipeDraft | null>(null)
  const catalog = ref<FoodItem[]>([])
  const pickerMode = ref<'list' | 'create'>('list')
  const query = ref('')
  const saving = ref(false)

  foodService.getRecipeDraft().then((r) => { recipe.value = r })

  async function refreshCatalog() {
    catalog.value = await foodService.getIngredientOptions()
  }
  refreshCatalog()

  const filteredCatalog = computed(() => catalog.value.filter(i => matchesQuery(i.name, query.value)))

  function changeServings(delta: number) {
    if (!recipe.value) return
    recipe.value.servings = Math.max(1, Math.min(12, recipe.value.servings + delta))
  }

  // Adding something already listed means more of it, not a second row.
  function addIngredient(item: FoodItem) {
    const existing = recipe.value?.ingredients.find(i => i.item.id === item.id)
    if (existing) existing.amount = stepAmount(existing.amount, item.step, 1)
    else recipe.value?.ingredients.push({ item, amount: item.per })
    query.value = ''
    pickerMode.value = 'list'
  }

  function stepIngredient(index: number, dir: 1 | -1) {
    const ing = recipe.value?.ingredients[index]
    if (ing) ing.amount = stepAmount(ing.amount, ing.item.step, dir)
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
    recipe, catalog, filteredCatalog, query, pickerMode, saving, canSave, saveHint, totals, perServing, cost,
    refreshCatalog, changeServings, addIngredient, stepIngredient, removeIngredient, startCreate, save,
  }
}
