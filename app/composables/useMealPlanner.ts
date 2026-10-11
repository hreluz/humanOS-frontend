import type { MealPlan } from '~/types/food'
import * as foodService from '~/services/foodService'

export function useMealPlanner() {
  const days = ref<string[]>([])
  const day = ref('Fri')
  const plan = ref<MealPlan | null>(null)

  foodService.getPlannerDays().then((d) => { days.value = d })

  let requestId = 0
  watch(day, async (value) => {
    const id = ++requestId
    const result = await foodService.getMealPlan(value)
    if (id === requestId) plan.value = result
  }, { immediate: true })

  return { days, day, plan }
}
