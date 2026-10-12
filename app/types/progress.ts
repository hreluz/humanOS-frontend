// One point per week, keyed by that week's Monday (YYYY-MM-DD, local time): the latest weight entry recorded in that week.
export interface WeighIn {
  week: string
  weight: number
  recordedAt: string
}
