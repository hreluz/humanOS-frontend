import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FoodItem } from '~/types/food'

const { navigateToMock } = vi.hoisted(() => ({
  // Returns undefined, so the test app's own navigations (and the auth middleware) pass straight through.
  navigateToMock: vi.fn(),
}))
mockNuxtImport('navigateTo', () => navigateToMock)

const ingredient = (over: Partial<FoodItem>): FoodItem => ({
  id: 'x', name: 'x', serving: '100 g', per: 100, unit: 'g', step: 10, isMine: false, kcal: 0, p: 0, c: 0, f: 0, portions: [], photos: [], ...over,
})
const banana = ingredient({ id: 'banana', name: 'Banana', kcal: 97, p: 0.74, c: 23, f: 0.29, portions: [{ key: 'medium', label: '1 medium', grams: 118 }] })
const egg = ingredient({
  id: 'egg_whole_hard_boiled', name: 'Egg, whole, hard-boiled', kcal: 155, p: 12.6, c: 1.12, f: 10.6,
  portions: [{ key: 'large', label: '1 large egg', grams: 50 }, { key: 'cup_chopped', label: '1 cup, chopped', grams: 136 }],
})
const beef = ingredient({ id: 'beef_chuck_braised', name: 'Beef chuck, braised', kcal: 309, p: 30.2, f: 19.9 })

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

describe('useQuickLog units', () => {
  it('starts an item with portions at 1 × the first one, worth its grams', async () => {
    const { toggleFood, basket } = await loadedQuickLog()
    toggleFood(egg)
    expect(basket.value[0]).toMatchObject({ amount: 1, portion: 'large' })
    expect(entryMacros(basket.value[0]!).kcal).toBe(78)
  })

  it('starts an item without portions at 100 g', async () => {
    const { toggleFood, basket } = await loadedQuickLog()
    toggleFood(beef)
    expect(basket.value[0]).toMatchObject({ amount: 100 })
    expect(basket.value[0]!.portion).toBeUndefined()
  })

  it('sets 1 or 100 when the unit changes, and the macros follow the portion', async () => {
    const { toggleFood, basket, setUnit, stepFood } = await loadedQuickLog()
    toggleFood(egg)
    setUnit(egg.id, null)
    expect(basket.value[0]).toMatchObject({ amount: 100 })
    expect(entryMacros(basket.value[0]!).kcal).toBe(155)
    setUnit(egg.id, 'large')
    stepFood(egg.id, 1)
    expect(basket.value[0]).toMatchObject({ amount: 2, portion: 'large' })
    expect(entryMacros(basket.value[0]!).kcal).toBe(155)
    setUnit(egg.id, 'cup_chopped')
    expect(basket.value[0]).toMatchObject({ amount: 1, portion: 'cup_chopped' })
  })

  it('logs the entry with its portion text', async () => {
    const { toggleFood, setFoodAmount, submit, meal } = await loadedQuickLog()
    const { log } = useFoodLog()
    await vi.waitUntil(() => log.value)
    toggleFood(egg)
    setFoodAmount(egg.id, 2)
    const mealKey = meal.value
    await submit()
    expect(log.value![mealKey].at(-1)).toMatchObject({ name: 'Egg, whole, hard-boiled', portion: '2 × 1 large egg (100 g)', kcal: 155 })
  })
})
