import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import type { AuthUser, UserProfile } from '~/types/auth'
import type { WeighIn } from '~/types/progress'
import * as authService from '~/services/authService'
import * as progressService from '~/services/progressService'

vi.mock('~/services/authService')
vi.mock('~/services/progressService')

const ana: AuthUser = { id: 1, name: 'Ana Torres', email: 'ana@example.com', role: 'user', emailVerifiedAt: null, createdAt: null }
const ben: AuthUser = { ...ana, id: 2, name: 'Ben Ito', email: 'ben@example.com' }
const profile: UserProfile = { goal: 'lose', age: '32', height: '180', weight: '82', target: '76', activity: 'Moderate' }

function clearCookies() {
  for (const name of ['humanos_token', 'humanos_profile', 'humanos_weighins']) document.cookie = `${name}=; Max-Age=0; path=/`
}

/** Seeds past weeks, oldest first, ending the week before this one. */
function seed(weights: number[]) {
  const entries: WeighIn[] = weights.map((weight, i) => {
    const d = new Date()
    d.setDate(d.getDate() - 7 * (weights.length - i))
    return { week: weekStart(d), weight, activity: 'Moderate' }
  })
  useState('weigh-ins').value = { userId: ana.id, entries }
}

async function signInAs(user: AuthUser) {
  vi.mocked(authService.login).mockResolvedValue({ token: `${user.id}|t`, user })
  const auth = useAuth()
  await auth.login(user.email, 'secret-123')
  await auth.saveProfile(profile)
  return auth
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(authService.saveProfile).mockImplementation(async p => p)
  vi.mocked(progressService.saveWeighIn).mockImplementation(async e => e)
  clearNuxtState()
  clearCookies()
})

describe('useWeighIns', () => {
  it('logs this week and syncs weight and activity to the profile', async () => {
    const auth = await signInAs(ana)
    const w = useWeighIns()
    expect(w.loggedThisWeek.value).toBe(false)

    await w.logWeighIn(81.4, 'Light')
    await nextTick()

    expect(w.latest.value).toEqual({ week: weekStart(), weight: 81.4, activity: 'Light' })
    expect(w.loggedThisWeek.value).toBe(true)
    expect(auth.user.value?.profile).toMatchObject({ weight: '81.4', activity: 'Light' })
  })

  it('replaces an entry logged earlier the same week', async () => {
    await signInAs(ana)
    const w = useWeighIns()
    await w.logWeighIn(81.4, 'Light')
    await w.logWeighIn(81.1, 'Moderate')

    expect(w.entries.value).toHaveLength(1)
    expect(w.latest.value?.weight).toBe(81.1)
  })

  it('computes changes and the distance to target', async () => {
    await signInAs(ana)
    seed([83, 82.5])
    const w = useWeighIns()
    await w.logWeighIn(82.1, 'Moderate')

    expect(w.weekDelta.value).toBeCloseTo(-0.4)
    expect(w.totalDelta.value).toBeCloseTo(-0.9)
    expect(w.toTarget.value).toBe(6.1)
    expect(w.history.value.map(h => h.weight)).toEqual([82.1, 82.5, 83])
    expect(w.chart.value?.points).toHaveLength(3)
    expect(w.chart.value?.targetY).not.toBeNull()
  })

  it(`keeps only the last ${MAX_WEIGH_INS} weeks`, async () => {
    await signInAs(ana)
    seed(Array.from({ length: MAX_WEIGH_INS }, (_, i) => 90 - i * 0.1))
    const w = useWeighIns()
    const oldest = w.entries.value[0]!.week

    await w.logWeighIn(85, 'Moderate')

    expect(w.entries.value).toHaveLength(MAX_WEIGH_INS)
    expect(w.entries.value[0]!.week).not.toBe(oldest)
  })

  it('ignores weigh-ins saved by another account', async () => {
    await signInAs(ana)
    seed([83, 82.5])
    await signInAs(ben)

    expect(useWeighIns().entries.value).toEqual([])
  })
})
