import type { ActivityLevel } from '~/types/auth'

// One weigh-in per week, keyed by that week's Monday (YYYY-MM-DD, local time).
export interface WeighIn {
  week: string
  weight: number
  activity: ActivityLevel
}
