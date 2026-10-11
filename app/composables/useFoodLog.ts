import type { FoodItem, MealKey } from '~/types/food'
import * as foodService from '~/services/foodService'

const MEALS: MealKey[] = ['breakfast', 'lunch', 'dinner', 'snacks']

const pct = (value: number, target: number) => Math.min(100, Math.round((value / target) * 100))

export function useFoodLog() {
  const { state: log, pending } = useServiceState('food-log', foodService.getFoodLog)
  const { state: targets } = useServiceState('daily-targets', foodService.getDailyTargets)
  const { state: intake } = useServiceState('macro-intake', foodService.getMacroIntake)

  const mealSections = computed(() => MEALS.map(key => ({
    key,
    label: key[0]!.toUpperCase() + key.slice(1),
    items: log.value?.[key] ?? [],
    kcal: (log.value?.[key] ?? []).reduce((a, i) => a + i.kcal, 0),
  })))

  const summary = computed(() => {
    if (!log.value || !targets.value || !intake.value) return null
    const t = targets.value
    const i = intake.value
    const totalKcal = mealSections.value.reduce((a, m) => a + m.kcal, 0)
    return {
      kcal: { value: totalKcal, target: t.kcal, pct: pct(totalKcal, t.kcal), remaining: Math.max(0, t.kcal - totalKcal) },
      protein: { value: i.protein, target: t.protein, pct: pct(i.protein, t.protein), remaining: Math.max(0, t.protein - i.protein) },
      carbs: { value: i.carbs, target: t.carbs, pct: pct(i.carbs, t.carbs) },
      fat: { value: i.fat, target: t.fat, pct: pct(i.fat, t.fat) },
    }
  })

  async function addFood(item: FoodItem) {
    log.value = await foodService.addFoodToLog(item)
  }

  return { log, pending, targets, mealSections, summary, addFood }
}
