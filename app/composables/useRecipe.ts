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

  function addIngredient(item: FoodItem) {
    recipe.value?.ingredients.push({ name: item.name, kcal: item.kcal, p: item.p, c: item.c, f: item.f })
    query.value = ''
    pickerMode.value = 'list'
  }

  function removeIngredient(index: number) {
    recipe.value?.ingredients.splice(index, 1)
  }

  function startCreate() {
    pickerMode.value = 'create'
  }

  const totals = computed(() => (recipe.value?.ingredients ?? [])
    .reduce((a, i) => ({ kcal: a.kcal + i.kcal, p: a.p + i.p, c: a.c + i.c, f: a.f + i.f }), { kcal: 0, p: 0, c: 0, f: 0 }))

  const perServing = computed(() => {
    const servings = recipe.value?.servings ?? 1
    const { kcal, p, c, f } = totals.value
    return { kcal: Math.round(kcal / servings), p: Math.round(p / servings), c: Math.round(c / servings), f: Math.round(f / servings) }
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
    recipe, catalog, filteredCatalog, query, pickerMode, saving, canSave, saveHint, totals, perServing,
    refreshCatalog, changeServings, addIngredient, removeIngredient, startCreate, save,
  }
}
