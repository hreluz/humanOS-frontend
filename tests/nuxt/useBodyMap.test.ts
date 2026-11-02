import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MockInstance } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { BACK_MUSCLES, FRONT_MUSCLES } from 'body-muscles'
import type { ExerciseDef, ExercisePage, MuscleKey } from '~/types/training'
import { api } from '~/services/api'
import * as trainingService from '~/services/trainingService'

vi.mock('~/services/api')

/** The backend's muscle catalog (`MuscleSeeder` in humanOS-backend), as `GET /v1/training/muscle-areas` returns it. */
const BACKEND_AREAS: [string, string, [string, string, 'front' | 'back'][]][] = [
  ['chest', 'Chest', [['upper_chest', 'Upper chest', 'front'], ['lower_chest', 'Mid & lower chest', 'front'], ['serratus', 'Serratus', 'front']]],
  ['shoulders', 'Shoulders', [['front_delts', 'Front delts', 'front'], ['side_delts', 'Side delts', 'front'], ['rear_delts', 'Rear delts', 'back']]],
  ['arms', 'Arms', [
    ['biceps', 'Biceps', 'front'], ['triceps_long', 'Triceps (long head)', 'back'], ['triceps_lateral', 'Triceps (lateral head)', 'back'],
    ['forearm_flexors', 'Forearm flexors', 'front'], ['forearm_extensors', 'Brachioradialis & forearm extensors', 'back'],
  ]],
  ['core', 'Core', [['upper_abs', 'Upper abs', 'front'], ['lower_abs', 'Lower abs', 'front'], ['obliques', 'Obliques', 'front']]],
  ['back', 'Back', [
    ['neck', 'Neck', 'back'], ['upper_traps', 'Upper traps', 'back'], ['mid_traps', 'Mid traps', 'back'],
    ['lower_traps', 'Lower traps', 'back'], ['lats', 'Lats', 'back'], ['lower_back', 'Lower back', 'back'],
  ]],
  ['legs', 'Legs', [
    ['glute_max', 'Glute max', 'back'], ['glute_med', 'Glute med', 'back'], ['hip_flexors', 'Hip flexors', 'front'],
    ['adductors', 'Adductors', 'front'], ['quads', 'Quads', 'front'], ['hamstrings_inner', 'Inner hamstrings', 'back'],
    ['hamstrings_outer', 'Outer hamstrings', 'back'], ['gastrocnemius', 'Calves (gastrocnemius)', 'back'], ['soleus', 'Soleus', 'back'],
    ['tibialis', 'Tibialis', 'front'],
  ]],
]
const BACKEND_MUSCLE_KEYS = BACKEND_AREAS.flatMap(([, , muscles]) => muscles.map(([key]) => key))
const muscleAreasResponse = {
  data: BACKEND_AREAS.map(([key, label, muscles]) => ({
    key,
    label,
    muscles: muscles.map(([key, label, body_view]) => ({ key, label, body_view })),
  })),
}

/** Answers the muscle catalog; the mocked `getExercises` below answers the exercises. */
function mockCatalog() {
  vi.mocked(api).mockResolvedValue(muscleAreasResponse)
}

const exercise = (key: string): ExerciseDef => ({ key, name: key, primary: ['lats'], secondary: [], equipmentGroup: 'gym', cue: null, photos: [] })
const page = (keys: string[], hasMore = false): ExercisePage => ({ items: keys.map(exercise), hasMore })
const keysOf = (list: ExerciseDef[]) => list.map(e => e.key)

/** A promise the test settles by hand, to look at the state while a request is in flight. */
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

let getExercises: MockInstance<typeof trainingService.getExercises>

beforeEach(() => {
  vi.restoreAllMocks()
  mockCatalog()
  getExercises = vi.spyOn(trainingService, 'getExercises').mockResolvedValue(page(['a']))
})

/** A body map whose muscle catalog has loaded, so `select` can use each muscle's side. */
async function loadedBodyMap() {
  const map = useBodyMap()
  const catalog = useMuscleCatalog()
  await vi.waitUntil(() => catalog.areas.value.length)
  return map
}

describe('muscle map', () => {
  it('maps every body-muscles region to a muscle or the plain silhouette', () => {
    const unmapped = [...FRONT_MUSCLES, ...BACK_MUSCLES]
      .filter(r => !muscleForRegion(r.id) && !NEUTRAL_REGION_IDS.has(regionBase(r.id)))
      .map(r => r.id)
    expect(unmapped).toEqual([])
  })

  it('can draw every muscle the backend returns, and nothing else', () => {
    expect(BACKEND_MUSCLE_KEYS).toHaveLength(30)
    for (const key of BACKEND_MUSCLE_KEYS) {
      expect(isMuscleKey(key), key).toBe(true)
      expect(isOnView(key as MuscleKey, 'front') || isOnView(key as MuscleKey, 'back'), key).toBe(true)
    }
    expect([...MUSCLE_KEYS].sort()).toEqual([...BACKEND_MUSCLE_KEYS].sort())
  })

  it('draws the neck on both sides', () => {
    expect(isOnView('neck', 'front') && isOnView('neck', 'back')).toBe(true)
  })

  it('draws the upper chest, mid & lower chest and serratus on the front', () => {
    expect(isOnView('upper_chest', 'front') && isOnView('lower_chest', 'front') && isOnView('serratus', 'front')).toBe(true)
  })
})

describe('useBodyMap', () => {
  it('starts on the front with no group picked, no exercises and no request', async () => {
    const map = useBodyMap()
    await flushPromises()
    expect(map.view.value).toBe('front')
    expect(map.equipmentGroup.value).toBeNull()
    expect(map.exercises.value).toEqual([])
    expect(getExercises).not.toHaveBeenCalled()
  })

  it('sends no request for a muscle alone', async () => {
    const map = useBodyMap()
    map.select('lats')
    await flushPromises()
    expect(getExercises).not.toHaveBeenCalled()
    expect(map.loading.value).toBe(false)
  })

  it('sends no request for a group alone', async () => {
    const map = useBodyMap()
    map.pickEquipment('gym')
    await flushPromises()
    expect(getExercises).not.toHaveBeenCalled()
    expect(map.loading.value).toBe(false)
  })

  it('requests a muscle and a group as a pair', async () => {
    const map = useBodyMap()
    map.select('lats')
    map.pickEquipment('gym')
    await flushPromises()
    expect(getExercises).toHaveBeenCalledTimes(1)
    expect(getExercises).toHaveBeenCalledWith('lats', 'gym')
    expect(keysOf(map.exercises.value)).toEqual(['a'])
  })

  it('replaces the group when another is picked', async () => {
    const map = useBodyMap()
    map.select('lats')
    map.pickEquipment('gym')
    await flushPromises()
    map.pickEquipment('dumbbell')
    await flushPromises()
    expect(map.equipmentGroup.value).toBe('dumbbell')
    expect(getExercises).toHaveBeenLastCalledWith('lats', 'dumbbell')
  })

  it('keeps the group when the muscle changes', async () => {
    const map = useBodyMap()
    map.select('lats')
    map.pickEquipment('gym')
    await flushPromises()
    map.select('quads')
    await flushPromises()
    expect(map.equipmentGroup.value).toBe('gym')
    expect(getExercises).toHaveBeenLastCalledWith('quads', 'gym')
  })

  it('sends no request when the current group is picked again', async () => {
    const map = useBodyMap()
    map.select('lats')
    map.pickEquipment('gym')
    await flushPromises()
    map.pickEquipment('gym')
    await flushPromises()
    expect(getExercises).toHaveBeenCalledTimes(1)
  })

  it('clears the old list as soon as the muscle changes', async () => {
    const map = useBodyMap()
    map.select('lats')
    map.pickEquipment('gym')
    await flushPromises()
    const next = deferred<ExercisePage>()
    getExercises.mockReturnValue(next.promise)
    map.select('quads')
    await nextTick()
    expect(map.exercises.value).toEqual([])
    expect(map.loading.value).toBe(true)
    next.resolve(page(['b']))
    await flushPromises()
    expect(keysOf(map.exercises.value)).toEqual(['b'])
    expect(map.loading.value).toBe(false)
  })

  it('never shows a response for an earlier muscle', async () => {
    const first = deferred<ExercisePage>()
    getExercises.mockReturnValueOnce(first.promise)
    const map = useBodyMap()
    map.select('lats')
    map.pickEquipment('gym')
    await nextTick()
    map.select('quads')
    await flushPromises()
    first.resolve(page(['stale']))
    await flushPromises()
    expect(keysOf(map.exercises.value)).toEqual(['a'])
  })

  it('sets failed when the first page is rejected, and retry fills the list', async () => {
    getExercises.mockRejectedValueOnce({ statusCode: 500 })
    const map = useBodyMap()
    map.select('lats')
    map.pickEquipment('gym')
    await flushPromises()
    expect(map.failed.value).toBe(true)
    expect(map.exercises.value).toEqual([])
    expect(map.loading.value).toBe(false)

    await map.retry()
    expect(map.failed.value).toBe(false)
    expect(keysOf(map.exercises.value)).toEqual(['a'])
  })

  it('ignores a failure from an earlier muscle', async () => {
    const first = deferred<ExercisePage>()
    getExercises.mockReturnValueOnce(first.promise)
    const map = useBodyMap()
    map.select('lats')
    map.pickEquipment('gym')
    await nextTick()
    map.select('quads')
    await flushPromises()
    first.reject({ statusCode: 500 })
    await flushPromises()
    expect(map.failed.value).toBe(false)
    expect(keysOf(map.exercises.value)).toEqual(['a'])
  })

  /** A body map showing page 1 of a longer list. */
  async function mapWithMore() {
    getExercises.mockResolvedValueOnce(page(['a', 'b'], true))
    const map = useBodyMap()
    map.select('lats')
    map.pickEquipment('gym')
    await flushPromises()
    return map
  }

  it('appends the next page in order, until the last one', async () => {
    const map = await mapWithMore()
    expect(map.hasMore.value).toBe(true)
    getExercises.mockResolvedValueOnce(page(['c'], false))
    await map.loadMore()
    expect(getExercises).toHaveBeenLastCalledWith('lats', 'gym', 2)
    expect(keysOf(map.exercises.value)).toEqual(['a', 'b', 'c'])
    expect(map.hasMore.value).toBe(false)

    getExercises.mockClear()
    await map.loadMore()
    expect(getExercises).not.toHaveBeenCalled()
  })

  it('keeps the list when a page is rejected, and asks for the same page again', async () => {
    const map = await mapWithMore()
    getExercises.mockRejectedValueOnce({ statusCode: 500 })
    await map.loadMore()
    expect(map.loadMoreFailed.value).toBe(true)
    expect(map.hasMore.value).toBe(true)
    expect(keysOf(map.exercises.value)).toEqual(['a', 'b'])

    getExercises.mockResolvedValueOnce(page(['c']))
    await map.loadMore()
    expect(getExercises).toHaveBeenLastCalledWith('lats', 'gym', 2)
    expect(map.loadMoreFailed.value).toBe(false)
    expect(keysOf(map.exercises.value)).toEqual(['a', 'b', 'c'])
  })

  it('ignores a page that returns after the muscle changed', async () => {
    const map = await mapWithMore()
    const late = deferred<ExercisePage>()
    getExercises.mockReturnValueOnce(late.promise)
    const loading = map.loadMore()
    map.select('quads')
    await flushPromises()
    late.resolve(page(['stale']))
    await loading
    expect(keysOf(map.exercises.value)).toEqual(['a'])
  })

  it('sends one request when a second loadMore comes while one is in flight', async () => {
    const map = await mapWithMore()
    const next = deferred<ExercisePage>()
    getExercises.mockClear()
    getExercises.mockReturnValueOnce(next.promise)
    const loading = map.loadMore()
    await map.loadMore()
    expect(getExercises).toHaveBeenCalledTimes(1)
    next.resolve(page(['c']))
    await loading
  })

  it('turns the figure around for a muscle only drawn on the other side', async () => {
    const map = await loadedBodyMap()
    map.select('lats')
    expect(map.view.value).toBe('back')
    map.select('upper_abs')
    expect(map.view.value).toBe('front')
  })

  it('turns to the muscle\'s side from the catalog', async () => {
    const map = await loadedBodyMap()
    expect(map.view.value).toBe('front')
    map.select('rear_delts')
    expect(map.view.value).toBe('back')
  })

  it('keeps the side for the neck, which is drawn on both', async () => {
    const map = await loadedBodyMap()
    map.view.value = 'back'
    map.select('neck')
    expect(map.view.value).toBe('back')
    map.view.value = 'front'
    map.select('neck')
    expect(map.view.value).toBe('front')
  })
})

describe('useTraining.addExercise', () => {
  it('appends a library exercise to today\'s workout', async () => {
    // Wipes today's workout, so its load runs again too.
    clearNuxtState()
    clearNuxtData()
    const training = useTraining()
    await vi.waitUntil(() => training.workout.value)
    expect(training.hasExercise('Pull-up')).toBe(false)
    await training.addExercise({ ...exercise('pull_up'), name: 'Pull-up' }, 'Bodyweight')
    expect(training.hasExercise('Pull-up')).toBe(true)
    expect(training.workout.value!.exercises.at(-1)).toMatchObject({ name: 'Pull-up', equip: 'Bodyweight' })
  })
})
