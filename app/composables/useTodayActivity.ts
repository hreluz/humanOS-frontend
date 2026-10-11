import * as statsService from '~/services/statsService'

export function useTodayActivity() {
  const { state: activity, pending } = useServiceState('today-activity', statsService.getTodayActivity)
  const steps = computed(() => {
    if (!activity.value) return null
    const { steps, stepsGoal } = activity.value
    return { value: steps, goal: stepsGoal, remaining: Math.max(0, stepsGoal - steps), pct: Math.min(100, Math.round((steps / stepsGoal) * 100)) }
  })
  return { steps, pending }
}
