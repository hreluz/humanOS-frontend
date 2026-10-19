import type { Accent } from './ui'

/** A daily total that logging moves; goals with one compute their progress from today's log. */
export type DailyMetric = 'protein' | 'kcal' | 'steps' | 'activeKcal' | 'waterMl'

export interface Goal {
  id: string
  label: string
  sub: string
  pct: number
  accent: Accent
  metric?: DailyMetric
  target?: number
}

export interface GoalTemplate {
  key: string
  label: string
  hint: string
  defaultTarget: number
  step: number
  min: number
  icon: string
  accent: Accent
  unit: string
  metric?: DailyMetric
  /** Multiplier from the template's unit to the metric's (e.g. L → ml). */
  metricScale?: number
  /** Format target with thousands separators (e.g. steps). */
  localeFormat?: boolean
  /** `{value}` is the formatted target, `{raw}` the bare number. */
  labelTemplate: string
}
