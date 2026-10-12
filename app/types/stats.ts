export type StatsPeriod = 'Day' | 'Week' | 'Month'

export interface PeriodStats {
  steps: string
  activeKcal: string
  restingHr: string
  sleep: string
  weight: string
  vo2: string
}

export interface WeeklyReview {
  range: string
  recommendation: string
  avgCalories: string
  proteinHit: string
  workouts: string
  avgSleep: string
}

export interface TodayActivity {
  steps: number
  stepsGoal: number
}
