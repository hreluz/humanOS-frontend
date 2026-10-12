/** Today's totals for every daily metric, from the food log and activity (tracked + logged). */
export function useToday() {
  const { summary } = useFoodLog()
  const { today } = useTodayActivity()

  const totals = computed<DailyTotals | null>(() => {
    if (!summary.value || !today.value) return null
    return {
      protein: summary.value.protein.value,
      kcal: summary.value.kcal.value,
      steps: today.value.steps,
      activeKcal: today.value.activeKcal,
      waterMl: today.value.waterMl,
    }
  })

  return { totals }
}
