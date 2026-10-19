import * as activityService from '~/services/activityService'
import * as goalService from '~/services/goalService'

const DEFAULT_STEPS_GOAL = 10000

export function useTodayActivity() {
  const { state: day, pending } = useServiceState('activity-day', activityService.getActivityDay)
  // Raw goals (not useGoals, which depends on this composable) for the steps target.
  const { state: goals } = useServiceState('goals', goalService.getGoals)

  const today = computed(() => day.value?.today ?? null)
  const log = computed(() => day.value?.log ?? [])

  const steps = computed(() => {
    if (!today.value) return null
    const goal = goals.value?.find(g => g.metric === 'steps')?.target ?? DEFAULT_STEPS_GOAL
    const value = today.value.steps
    return { value, goal, remaining: Math.max(0, goal - value), pct: metricPct(value, goal) }
  })

  async function logActivity(key: string, amount: number, kg: number, kcal?: number, loggedAt?: string) {
    day.value = await activityService.logActivity(key, amount, kg, kcal, loggedAt)
  }

  async function logWater(ml: number, loggedAt?: string) {
    day.value = await activityService.logWater(ml, loggedAt)
  }

  return { today, log, steps, pending, logActivity, logWater }
}
