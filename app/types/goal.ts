import type { Accent } from './ui'

export interface Goal {
  id: string
  label: string
  sub: string
  pct: number
  accent: Accent
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
  /** Format target with thousands separators (e.g. steps). */
  localeFormat?: boolean
  /** `{value}` is the formatted target, `{raw}` the bare number. */
  labelTemplate: string
}
