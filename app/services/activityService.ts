import type { ActivityDef, ActivityEntry, TodayActivity } from '~/types/activity'
import { burnedKcal } from '~/utils/logging'
import { ICONS } from '~/utils/ui'
import { delay } from './mocks/delay'
import { ACTIVITIES, INITIAL_ACTIVITY_LOG, TRACKED_TODAY } from './mocks/activities'

// Module-scoped copy stands in for the backend; callers only ever get clones.
const log: ActivityEntry[] = structuredClone(INITIAL_ACTIVITY_LOG)

export interface ActivityDay {
  log: ActivityEntry[]
  today: TodayActivity
}

function day(): ActivityDay {
  const today = log.reduce((t, e) => ({ steps: t.steps + e.steps, activeKcal: t.activeKcal + e.kcal, waterMl: t.waterMl + e.ml }), { ...TRACKED_TODAY })
  return { log: structuredClone(log), today }
}

export async function getActivities(): Promise<ActivityDef[]> {
  await delay()
  return structuredClone(ACTIVITIES)
}

/** Today's hand-logged entries plus totals (tracked + logged). */
export async function getActivityDay(): Promise<ActivityDay> {
  await delay()
  return day()
}

/** Logs `amount` (minutes or steps) of an activity; burn is `kcal` if given, else estimated from body weight in kg. */
export async function logActivity(key: string, amount: number, kg: number, kcal?: number): Promise<ActivityDay> {
  await delay()
  const def = ACTIVITIES.find(a => a.key === key)
  if (!def) throw new Error(`Unknown activity: ${key}`)
  log.push({
    id: key + '_' + Date.now(), kind: 'activity', label: def.label, icon: def.icon, amount, unit: def.unit,
    kcal: kcal ?? burnedKcal(def, amount, kg), steps: def.unit === 'steps' ? amount : 0, ml: 0, loggedAt: new Date().toISOString(),
  })
  return day()
}

export async function logWater(ml: number): Promise<ActivityDay> {
  await delay()
  log.push({ id: 'water_' + Date.now(), kind: 'water', label: 'Water', icon: ICONS.water, amount: ml, unit: 'ml', kcal: 0, steps: 0, ml, loggedAt: new Date().toISOString() })
  return day()
}
