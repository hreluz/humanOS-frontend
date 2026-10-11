import type { ActivityLevel } from '~/types/auth'
import type { WeighIn } from '~/types/progress'
import * as progressService from '~/services/progressService'

interface StoredWeighIns {
  userId: number
  entries: WeighIn[]
}

// Half a year of weekly entries keeps the cookie well under its 4 KB limit.
export const MAX_WEIGH_INS = 26

const OPTS = { default: (): StoredWeighIns | null => null, sameSite: 'lax' as const, maxAge: 60 * 60 * 24 * 365 }

// Chart viewBox and inner padding, in SVG units.
const W = 320
const H = 120
const PAD_X = 10
const PAD_Y = 14

export function useWeighIns() {
  const { user, saveProfile } = useAuth()
  // Shared state is the source of truth so every caller updates at once; the cookie persists it.
  const cookie = useCookie<StoredWeighIns | null>('humanos_weighins', OPTS)
  const stored = useState<StoredWeighIns | null>('weigh-ins', () => cookie.value)
  const saving = ref(false)

  // Entries saved by another account on this browser are ignored. Oldest first.
  const entries = computed<WeighIn[]>(() =>
    user.value && stored.value?.userId === user.value.id
      ? [...stored.value.entries].sort((a, b) => a.week.localeCompare(b.week))
      : [],
  )
  const latest = computed(() => entries.value.at(-1) ?? null)
  const previous = computed(() => entries.value.at(-2) ?? null)
  const loggedThisWeek = computed(() => latest.value?.week === weekStart())

  const goal = computed(() => user.value?.profile?.goal)
  const target = computed(() => {
    const p = user.value?.profile
    return p && goalNeedsTarget(p.goal) && +p.target > 0 ? +p.target : null
  })

  const weekDelta = computed(() => latest.value && previous.value ? latest.value.weight - previous.value.weight : null)
  const totalDelta = computed(() => latest.value && entries.value.length > 1 ? latest.value.weight - entries.value[0]!.weight : null)
  /** Kilograms left to reach the target; zero or less once it's reached. */
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
    const y = (kg: number) => PAD_Y + ((max - kg) / (max - min)) * (H - PAD_Y * 2)
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

  /** Records this week's weigh-in (replacing one already logged this week) and syncs the profile. */
  async function logWeighIn(weight: number, activity: ActivityLevel) {
    const account = user.value
    if (!account || saving.value) return
    saving.value = true
    try {
      const entry = await progressService.saveWeighIn({ week: weekStart(), weight, activity })
      const others = entries.value.filter(e => e.week !== entry.week)
      stored.value = { userId: account.id, entries: [...others, entry].slice(-MAX_WEIGH_INS) }
      cookie.value = stored.value
      const profile = user.value?.profile
      if (profile) await saveProfile({ ...profile, weight: String(weight), activity })
    }
    finally {
      saving.value = false
    }
  }

  return { entries, latest, previous, loggedThisWeek, goal, target, weekDelta, totalDelta, toTarget, history, chart, saving, logWeighIn }
}
