import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthUser, GoalKey } from '~/types/auth'
import type { Profile, WeightEntry } from '~/types/profile'
import * as authService from '~/services/authService'
import * as profileService from '~/services/profileService'

vi.mock('~/services/authService')
vi.mock('~/services/profileService')

const ana: AuthUser = { id: 1, name: 'Ana Torres', email: 'ana@example.com', role: 'user', emailVerifiedAt: null, createdAt: null }
const metric: Profile = {
  birthDate: '1994-04-15', age: 32, sex: 'male', activityLevel: 'moderately_active', unitSystem: 'metric',
  height: 180, weight: 82.1, targetWeight: 76, heightCm: 180, weightKg: 82.1, targetWeightKg: 76, updatedAt: null,
}
const imperial: Profile = { ...metric, unitSystem: 'imperial', height: 71, weight: 181, targetWeight: 167.6 }

const DAY = 24 * 60 * 60 * 1000
// Monday 00:00 of this week (local time), so "same week" entries never straddle a week boundary.
const monday = () => {
  const [y, m, d] = weekStart().split('-').map(Number)
  return new Date(y!, m! - 1, d!).getTime()
}
let nextId = 1
/** An entry recorded `weeksAgo` weeks before this week's Monday, `hours` into that day. */
const entry = (weight: number, weeksAgo: number, hours = 9): WeightEntry =>
  ({ id: nextId++, weight, weightKg: weight, recordedAt: new Date(monday() - weeksAgo * 7 * DAY + hours * 3600_000).toISOString() })

async function signIn(profile: Profile, goal: GoalKey = 'lose') {
  vi.mocked(authService.login).mockResolvedValue({ token: '1|t', user: ana })
  vi.mocked(profileService.getProfile).mockResolvedValue(profile)
  const auth = useAuth()
  await auth.login(ana.email, 'secret-123')
  await auth.fetchProfile()
  auth.setGoal(goal)
  return auth
}

beforeEach(() => {
  vi.resetAllMocks()
  clearNuxtState()
  for (const name of ['humanos_token', 'humanos_goal']) document.cookie = `${name}=; Max-Age=0; path=/`
})

describe('useWeighIns', () => {
  it('groups entries by week, keeping the latest per week, oldest first', async () => {
    await signIn(metric)
    // API order: newest first.
    vi.mocked(profileService.weightEntries).mockResolvedValue([entry(81.1, 0, 20), entry(81.4, 0, 8), entry(82.5, 1), entry(83, 2)])
    const w = useWeighIns()

    await w.load()

    expect(w.entries.value.map(e => e.weight)).toEqual([83, 82.5, 81.1])
    expect(w.latest.value?.week).toBe(weekStart())
    expect(w.loggedThisWeek.value).toBe(true)
  })

  it('loads the history once', async () => {
    await signIn(metric)
    vi.mocked(profileService.weightEntries).mockResolvedValue([entry(82, 0)])
    const w = useWeighIns()

    await w.load()
    await w.load()

    expect(profileService.weightEntries).toHaveBeenCalledOnce()
  })

  it('computes changes and the distance to target', async () => {
    await signIn(metric)
    vi.mocked(profileService.weightEntries).mockResolvedValue([entry(82.1, 0), entry(82.5, 1), entry(83, 2)])
    const w = useWeighIns()
    await w.load()

    expect(w.weekDelta.value).toBeCloseTo(-0.4)
    expect(w.totalDelta.value).toBeCloseTo(-0.9)
    expect(w.toTarget.value).toBe(6.1)
    expect(w.history.value.map(h => h.weight)).toEqual([82.1, 82.5, 83])
    expect(w.chart.value?.points).toHaveLength(3)
    expect(w.chart.value?.targetY).not.toBeNull()
  })

  it('uses the profile unit and target', async () => {
    await signIn(imperial)
    const w = useWeighIns()
    expect(w.unit.value).toBe('lb')
    expect(w.target.value).toBe(167.6)
  })

  it.each(['maintain', 'fitness'] as const)('has no target for %s', async (goal) => {
    await signIn(metric, goal)
    const w = useWeighIns()
    expect(w.unit.value).toBe('kg')
    expect(w.target.value).toBeNull()
  })

  it('logs a weigh-in as a PUT of the saved profile with the new weight, then refetches', async () => {
    const auth = await signIn(metric)
    vi.mocked(profileService.saveProfile).mockResolvedValue({ ...metric, weight: 81.4 })
    vi.mocked(profileService.weightEntries).mockResolvedValue([entry(81.4, 0)])
    const w = useWeighIns()

    await w.logWeighIn(81.4)

    expect(profileService.saveProfile).toHaveBeenCalledWith({
      unitSystem: 'metric', birthDate: '1994-04-15', sex: 'male', height: 180, weight: 81.4, targetWeight: 76, activityLevel: 'moderately_active',
    })
    expect(auth.profile.value?.weight).toBe(81.4)
    expect(w.latest.value?.weight).toBe(81.4)
    expect(w.saving.value).toBe(false)
  })
})
