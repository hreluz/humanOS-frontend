import type { FoodItem, MealKey } from '~/types/food'
import * as foodService from '~/services/foodService'

const MEALS: MealKey[] = ['breakfast', 'lunch', 'dinner', 'snacks']

export function useFoodLog() {
  const { state: log, pending } = useServiceState('food-log', foodService.getFoodLog)
  const { state: targets } = useServiceState('daily-targets', foodService.getDailyTargets)

  const mealSections = computed(() => MEALS.map(key => ({
    key,
    label: key[0]!.toUpperCase() + key.slice(1),
    items: log.value?.[key] ?? [],
    kcal: (log.value?.[key] ?? []).reduce((a, i) => a + i.kcal, 0),
  })))

  const summary = computed(() => {
    if (!log.value || !targets.value) return null
    const t = targets.value
    const items = mealSections.value.flatMap(m => m.items)
    const sum = (key: 'kcal' | 'p' | 'c' | 'f') => Math.round(items.reduce((a, i) => a + i[key], 0))
    const kcal = sum('kcal')
    const protein = sum('p')
    return {
      kcal: { value: kcal, target: t.kcal, pct: metricPct(kcal, t.kcal), remaining: Math.max(0, t.kcal - kcal) },
      protein: { value: protein, target: t.protein, pct: metricPct(protein, t.protein), remaining: Math.max(0, t.protein - protein) },
      carbs: { value: sum('c'), target: t.carbs, pct: metricPct(sum('c'), t.carbs) },
      fat: { value: sum('f'), target: t.fat, pct: metricPct(sum('f'), t.fat) },
    }
  })

  async function addFoods(entries: { item: FoodItem, amount: number }[], meal: MealKey) {
    log.value = await foodService.addFoodsToLog(entries, meal)
  }

  return { log, pending, targets, mealSections, summary, addFoods }
}
