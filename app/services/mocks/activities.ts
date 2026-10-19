import type { ActivityDef, ActivityEntry, TodayActivity } from '~/types/activity'

export const ACTIVITIES: ActivityDef[] = [
  { key: 'walking', label: 'Walking', icon: 'M13 3l-8 11h6l-1 7 8-11h-6l1-7z', met: 3.5, unit: 'steps', defaultAmount: 1000, step: 500 },
  { key: 'running', label: 'Running', icon: 'M4 17l4-5 3 3 5-7 4 5', met: 9.8, unit: 'min', defaultAmount: 20, step: 5 },
  { key: 'cycling', label: 'Cycling', icon: 'M2 17.5a3.5 3.5 0 107 0 3.5 3.5 0 10-7 0zM15 17.5a3.5 3.5 0 107 0 3.5 3.5 0 10-7 0zM5.5 17.5L9 9h6l3.5 8.5M9 9l3 8.5L15 9M7 6h4', met: 7.5, unit: 'min', defaultAmount: 15, step: 5 },
  { key: 'swimming', label: 'Swimming', icon: 'M2 17c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5M2 21c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5M8 12l3-3 2 2 3-3', met: 6, unit: 'min', defaultAmount: 30, step: 5 },
  { key: 'strength', label: 'Strength training', icon: 'M4 12h4m8 0h4M8 8v8m8-8v8', met: 5, unit: 'min', defaultAmount: 45, step: 5 },
  { key: 'hiit', label: 'HIIT', icon: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6', met: 8, unit: 'min', defaultAmount: 20, step: 5 },
  { key: 'rowing', label: 'Rowing', icon: 'M3 19h18M5 15l7-9 7 9', met: 7, unit: 'min', defaultAmount: 20, step: 5 },
  { key: 'yoga', label: 'Yoga', icon: 'M12 3a2 2 0 100 4 2 2 0 000-4zM12 7v7M6 11h12M8 21l4-7 4 7', met: 2.5, unit: 'min', defaultAmount: 30, step: 5 },
]

/** What the phone tracked on its own today, before anything was logged by hand. */
export const TRACKED_TODAY: TodayActivity = { steps: 5200, activeKcal: 300, waterMl: 1500 }

const todayAt = (h: number, m: number) => {
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

export const INITIAL_ACTIVITY_LOG: ActivityEntry[] = [
  { id: 'seed_walk', kind: 'activity', label: 'Walking', icon: ACTIVITIES[0]!.icon, amount: 1000, unit: 'steps', kcal: 41, steps: 1000, ml: 0, loggedAt: todayAt(8, 15) },
]
