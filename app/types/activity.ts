export type ActivityUnit = 'min' | 'steps'

export interface ActivityDef {
  key: string
  label: string
  icon: string
  /** Metabolic equivalent; burn = MET × kg × hours. Unused for step-counted activities. */
  met: number
  unit: ActivityUnit
  defaultAmount: number
  step: number
}

export interface ActivityEntry {
  id: string
  kind: 'activity' | 'water'
  label: string
  icon: string
  amount: number
  unit: ActivityUnit | 'ml'
  kcal: number
  steps: number
  ml: number
  loggedAt: string
}

export interface TodayActivity {
  steps: number
  activeKcal: number
  waterMl: number
}
