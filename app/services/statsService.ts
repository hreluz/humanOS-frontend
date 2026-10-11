import type { PeriodStats, StatsPeriod, TodayActivity, WeeklyReview } from '~/types/stats'
import { delay } from './mocks/delay'
import { STATS, TODAY_ACTIVITY, WEEKLY_REVIEW } from './mocks/stats'

export async function getStats(period: StatsPeriod): Promise<PeriodStats> {
  await delay()
  return { ...STATS[period] }
}

export async function getWeeklyReview(): Promise<WeeklyReview> {
  await delay()
  return { ...WEEKLY_REVIEW }
}

export async function getTodayActivity(): Promise<TodayActivity> {
  await delay()
  return { ...TODAY_ACTIVITY }
}
