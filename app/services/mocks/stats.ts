import type { PeriodStats, StatsPeriod, TodayActivity, WeeklyReview } from '~/types/stats'

export const STATS: Record<StatsPeriod, PeriodStats> = {
  Day: { steps: '6,200', activeKcal: '480', restingHr: '58 bpm', sleep: '7h 12m', weight: '82.1 kg', vo2: '41.2' },
  Week: { steps: '8,140 avg', activeKcal: '510 avg', restingHr: '57 bpm', sleep: '6h 52m avg', weight: '82.3 kg', vo2: '41.0' },
  Month: { steps: '7,860 avg', activeKcal: '495 avg', restingHr: '57 bpm', sleep: '6h 58m avg', weight: '83.1 kg', vo2: '40.6' },
}

export const WEEKLY_REVIEW: WeeklyReview = {
  range: 'June 29 – July 5',
  recommendation: 'You lost 0.4kg this week — right on pace. Sleep averaged 6h 40m; try adding 45 minutes next week.',
  avgCalories: '2,340',
  proteinHit: '6/7',
  workouts: '4/5',
  avgSleep: '6h 40m',
}

export const TODAY_ACTIVITY: TodayActivity = { steps: 6200, stepsGoal: 10000 }
