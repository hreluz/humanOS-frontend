import type { FoodItem, RecipeDraft } from '~/types/food'
import * as foodService from '~/services/foodService'

export function useRecipe() {
  const recipe = ref<RecipeDraft | null>(null)
  const catalog = ref<FoodItem[]>([])
  const showPicker = ref(false)
  const pickerMode = ref<'list' | 'create'>('list')
  const query = ref('')
  const saving = ref(false)

  foodService.getRecipeDraft().then((r) => { recipe.value = r })

  async function togglePicker() {
    showPicker.value = !showPicker.value
    pickerMode.value = 'list'
    query.value = ''
    if (showPicker.value) catalog.value = await foodService.getIngredientOptions()
  }

  const filteredCatalog = computed(() => catalog.value.filter(i => matchesQuery(i.name, query.value)))

  function changeServings(delta: number) {
    if (!recipe.value) return
    recipe.value.servings = Math.max(1, Math.min(12, recipe.value.servings + delta))
  }

  function addIngredient(item: FoodItem) {
    recipe.value?.ingredients.push({ name: item.name, kcal: item.kcal, p: item.p, c: item.c, f: item.f })
    showPicker.value = false
  }

  function removeIngredient(index: number) {
    recipe.value?.ingredients.splice(index, 1)
  }

  function startCreate() {
    pickerMode.value = 'create'
  }

  const perServing = computed(() => {
    if (!recipe.value) return { kcal: 0, p: 0, c: 0, f: 0 }
    const { servings, ingredients } = recipe.value
    const sum = ingredients.reduce((a, i) => ({ kcal: a.kcal + i.kcal, p: a.p + i.p, c: a.c + i.c, f: a.f + i.f }), { kcal: 0, p: 0, c: 0, f: 0 })
    return { kcal: Math.round(sum.kcal / servings), p: Math.round(sum.p / servings), c: Math.round(sum.c / servings), f: Math.round(sum.f / servings) }
  })

  async function save() {
    if (!recipe.value) return
    saving.value = true
    try {
      return await foodService.saveRecipe(recipe.value)
    }
    finally {
      saving.value = false
    }
  }

  return {
    recipe, catalog, filteredCatalog, query, showPicker, pickerMode, saving, perServing,
    togglePicker, changeServings, addIngredient, removeIngredient, startCreate, save,
  }
}
