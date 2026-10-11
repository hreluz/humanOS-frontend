import type { StatsPeriod } from '~/types/stats'
import * as statsService from '~/services/statsService'

export const STATS_PERIODS: StatsPeriod[] = ['Day', 'Week', 'Month']

export function useStats() {
  const period = ref<StatsPeriod>('Day')
  const { data: stats, pending } = useAsyncData(
    () => `stats:${period.value}`,
    () => statsService.getStats(period.value),
  )
  // Keep showing the previous period's numbers while the next one loads.
  const shown = ref(stats.value)
  watch(stats, (value) => { if (value) shown.value = value })
  return { period, stats: shown, pending }
}
