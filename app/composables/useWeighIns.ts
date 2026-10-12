import type { Profile, ProfilePayload, WeightEntry } from '~/types/profile'
import type { WeighIn } from '~/types/progress'
import * as profileService from '~/services/profileService'

// Chart viewBox and inner padding, in SVG units.
const W = 320
const H = 120
const PAD_X = 10
const PAD_Y = 14

/** The saved profile as a PUT body, so a weigh-in only changes the weight. */
const toPayload = (p: Profile, weight: number): ProfilePayload => ({
  unitSystem: p.unitSystem,
  birthDate: p.birthDate,
  sex: p.sex,
  height: p.height,
  weight,
  targetWeight: p.targetWeight ?? weight,
  activityLevel: p.activityLevel,
})

export function useWeighIns() {
  const { profile, goal, saveProfile } = useAuth()
  // Every entry from the API, newest first; null until loaded.
  const raw = useState<WeightEntry[] | null>('weight-entries', () => null)
  const saving = ref(false)

  const unit = computed(() => weightUnit(profile.value?.unitSystem ?? 'metric'))

  // One point per week (the latest entry recorded that week), oldest first. Weights are in the profile's unit.
  const entries = computed<WeighIn[]>(() => {
    const byWeek = new Map<string, WeighIn>()
    for (const e of raw.value ?? []) {
      const week = weekStart(new Date(e.recordedAt))
      const current = byWeek.get(week)
      if (!current || Date.parse(e.recordedAt) > Date.parse(current.recordedAt)) {
        byWeek.set(week, { week, weight: e.weight, recordedAt: e.recordedAt })
      }
    }
    return [...byWeek.values()].sort((a, b) => a.week.localeCompare(b.week))
  })
  const latest = computed(() => entries.value.at(-1) ?? null)
  const previous = computed(() => entries.value.at(-2) ?? null)
  const loggedThisWeek = computed(() => latest.value?.week === weekStart())

  const target = computed(() => {
    const t = profile.value?.targetWeight
    return goal.value && goalNeedsTarget(goal.value) && t != null && t > 0 ? t : null
  })

  const weekDelta = computed(() => latest.value && previous.value ? latest.value.weight - previous.value.weight : null)
  const totalDelta = computed(() => latest.value && entries.value.length > 1 ? latest.value.weight - entries.value[0]!.weight : null)
  /** Weight (in `unit`) left to reach the target; zero or less once it's reached. */
  const toTarget = computed(() => {
    if (!latest.value || target.value === null) return null
    const left = goal.value === 'build' ? target.value - latest.value.weight : latest.value.weight - target.value
    return Math.round(left * 10) / 10
  })

  /** Newest first, each with its change from the week before. */
  const history = computed(() => entries.value
    .map((e, i) => ({ ...e, delta: i > 0 ? e.weight - entries.value[i - 1]!.weight : null }))
    .reverse())

  const chart = computed(() => {
    const list = entries.value
    if (!list.length) return null
    const values = list.map(e => e.weight).concat(target.value ?? [])
    const min = Math.min(...values) - 0.5
    const max = Math.max(...values) + 0.5
    const y = (weight: number) => PAD_Y + ((max - weight) / (max - min)) * (H - PAD_Y * 2)
    const x = (i: number) => list.length === 1 ? W / 2 : PAD_X + (i / (list.length - 1)) * (W - PAD_X * 2)
    const points = list.map((e, i) => ({ x: x(i), y: y(e.weight), week: e.week, weight: e.weight }))
    return {
      width: W,
      height: H,
      points,
      line: points.map(p => `${p.x},${p.y}`).join(' '),
      targetY: target.value !== null ? y(target.value) : null,
    }
  })

  /** Fetches the weight history (PUT returns the profile, not the new entry). */
  async function refresh() {
    raw.value = await profileService.weightEntries()
  }

  /** Loads the weight history once per session. */
  async function load() {
    if (raw.value === null) await refresh()
  }

  /** Logs a weigh-in: PUTs the saved profile with the new weight (the backend records the entry), then refetches the history. */
  async function logWeighIn(weight: number) {
    const current = profile.value
    if (!current || saving.value) return
    saving.value = true
    try {
      await saveProfile(toPayload(current, weight))
      await refresh()
    }
    finally {
      saving.value = false
    }
  }

  return {
    entries, latest, previous, loggedThisWeek, goal, unit, target, weekDelta, totalDelta, toTarget, history, chart, saving,
    load, refresh, logWeighIn,
  }
}
