import type { ActivityDef, ActivityEntry, TodayActivity } from '~/types/activity'
import { burnedKcal, isSameDay } from '~/utils/logging'
import { ICONS } from '~/utils/ui'
import { delay } from './mocks/delay'
import { ACTIVITIES, INITIAL_ACTIVITY_LOG, TRACKED_TODAY } from './mocks/activities'

// Module-scoped copy stands in for the backend; callers only ever get clones.
const log: ActivityEntry[] = structuredClone(INITIAL_ACTIVITY_LOG)

export interface ActivityDay {
  log: ActivityEntry[]
  today: TodayActivity
}

/** Today's entries and totals; entries logged to another day are kept but left out. */
function day(): ActivityDay {
  const now = new Date()
  const entries = log.filter(e => isSameDay(e.loggedAt, now))
  const today = entries.reduce((t, e) => ({ steps: t.steps + e.steps, activeKcal: t.activeKcal + e.kcal, waterMl: t.waterMl + e.ml }), { ...TRACKED_TODAY })
  return { log: structuredClone(entries), today }
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

/**
 * Logs `amount` (minutes or steps) of an activity at `loggedAt` (ISO, default now); burn is `kcal` if given,
 * else estimated from body weight in kg.
 */
export async function logActivity(key: string, amount: number, kg: number, kcal?: number, loggedAt = new Date().toISOString()): Promise<ActivityDay> {
  await delay()
  const def = ACTIVITIES.find(a => a.key === key)
  if (!def) throw new Error(`Unknown activity: ${key}`)
  log.push({
    id: key + '_' + Date.now(), kind: 'activity', label: def.label, icon: def.icon, amount, unit: def.unit,
    kcal: kcal ?? burnedKcal(def, amount, kg), steps: def.unit === 'steps' ? amount : 0, ml: 0, loggedAt,
  })
  return day()
}

/** Logs `ml` of water at `loggedAt` (ISO, default now). */
export async function logWater(ml: number, loggedAt = new Date().toISOString()): Promise<ActivityDay> {
  await delay()
  log.push({ id: 'water_' + Date.now(), kind: 'water', label: 'Water', icon: ICONS.water, amount: ml, unit: 'ml', kcal: 0, steps: 0, ml, loggedAt })
  return day()
}
