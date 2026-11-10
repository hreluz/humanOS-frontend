import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FoodItem } from '~/types/food'

const { navigateToMock } = vi.hoisted(() => ({
  // Returns undefined, so the test app's own navigations (and the auth middleware) pass straight through.
  navigateToMock: vi.fn(),
}))
mockNuxtImport('navigateTo', () => navigateToMock)

const banana: FoodItem = { id: 'banana_t', name: 'Banana', brand: 'Generic', serving: '1 banana', per: 1, unit: 'piece', pieceName: 'banana', step: 1, kcal: 105, p: 1.3, c: 27, f: 0.4 }

/** Sets `?tab=` on the current route, the way a link or a reload would. */
async function withTab(tab?: string) {
  await useRouter().replace({ query: tab === undefined ? {} : { tab } })
}

/** A quick log with its activity list loaded from the mocks. */
async function loadedQuickLog() {
  const q = useQuickLog()
  await vi.waitUntil(() => q.activityResults.value.length)
  return q
}

beforeEach(async () => {
  navigateToMock.mockReset()
  await withTab()
})

describe('useQuickLog tab', () => {
  it('reads food with no tab query', () => {
    expect(useQuickLog().tab.value).toBe('food')
  })

  it('reads food for an unknown tab', async () => {
    await withTab('nope')
    expect(useQuickLog().tab.value).toBe('food')
  })

  it('reads the tab named in the query', async () => {
    await withTab('water')
    expect(useQuickLog().tab.value).toBe('water')
  })

  it('replaces the query when the tab changes, without pushing history', () => {
    const { tab } = useQuickLog()
    tab.value = 'activity'
    expect(navigateToMock).toHaveBeenCalledWith({ query: { tab: 'activity' } }, { replace: true })
  })
})

describe('useQuickLog hasApproved', () => {
  it('is false at first', async () => {
    const { hasApproved } = await loadedQuickLog()
    expect(hasApproved.value).toBe(false)
  })

  it('is true with one basket item', async () => {
    const { hasApproved, toggleFood } = await loadedQuickLog()
    toggleFood(banana)
    expect(hasApproved.value).toBe(true)
  })

  it('is true with a picked activity', async () => {
    const { hasApproved, selectActivity, activityResults } = await loadedQuickLog()
    selectActivity(activityResults.value[0]!.key)
    expect(hasApproved.value).toBe(true)
  })

  it('is false with only water changed', async () => {
    const { hasApproved, waterMl, stepWater } = await loadedQuickLog()
    waterMl.value = 750
    stepWater(1)
    expect(hasApproved.value).toBe(false)
  })
})

describe('useQuickLog submit', () => {
  it('clears the draft before it leaves', async () => {
    const { hasApproved, toggleFood, submit, basket } = await loadedQuickLog()
    toggleFood(banana)
    let draftWhenLeaving: boolean | undefined
    const record = () => { draftWhenLeaving = hasApproved.value }
    navigateToMock.mockImplementation(record)
    const back = vi.spyOn(useRouter(), 'back').mockImplementation(record)

    await submit()

    expect(draftWhenLeaving).toBe(false)
    expect(basket.value).toEqual([])
    back.mockRestore()
  })
})
