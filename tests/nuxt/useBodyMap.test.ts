import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { BACK_MUSCLES, FRONT_MUSCLES } from 'body-muscles'
import type { MuscleKey } from '~/types/training'
import { api } from '~/services/api'
import * as trainingService from '~/services/trainingService'
import { MOCK_LATENCY_MS } from '~/services/mocks/delay'
import { EXERCISES } from '~/services/mocks/exercises'

vi.mock('~/services/api')

const settle = async () => {
  await new Promise(r => setTimeout(r, MOCK_LATENCY_MS + 20))
  await flushPromises()
}

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

/** The six equipment groups, as `GET /v1/training/equipment-groups` returns them. */
const GROUP_KEYS = ['gym', 'dumbbell', 'bodyweight', 'kettlebell', 'bands', 'accessories']
const equipmentGroupsResponse = {
  data: [
    { key: 'gym', label: 'Gym', equipment: [{ key: 'barbell', label: 'Barbell' }, { key: 'machine', label: 'Machine' }, { key: 'cable', label: 'Cable' }, { key: 'ez_bar', label: 'EZ curl bar' }] },
    { key: 'dumbbell', label: 'Dumbbell', equipment: [{ key: 'dumbbell', label: 'Dumbbell' }] },
    { key: 'bodyweight', label: 'Bodyweight', equipment: [{ key: 'body_only', label: 'Body only' }] },
    { key: 'kettlebell', label: 'Kettlebell', equipment: [{ key: 'kettlebell', label: 'Kettlebell' }] },
    { key: 'bands', label: 'Bands', equipment: [{ key: 'bands', label: 'Resistance bands' }] },
    { key: 'accessories', label: 'Accessories', equipment: [{ key: 'medicine_ball', label: 'Medicine ball' }, { key: 'exercise_ball', label: 'Exercise ball' }, { key: 'foam_roll', label: 'Foam roll' }, { key: 'other', label: 'Other' }] },
  ],
}

/** Routes the mocked `api` by URL: both catalogs come from it. */
function mockCatalogs(equipmentGroups: () => Promise<unknown> = () => Promise.resolve(equipmentGroupsResponse)) {
  vi.mocked(api).mockImplementation((url: string) => url === '/v1/training/equipment-groups' ? equipmentGroups() : Promise.resolve(muscleAreasResponse))
}

beforeEach(() => {
  vi.restoreAllMocks()
  mockCatalogs()
})

/** Forgets the loaded equipment catalog, so the next `useBodyMap` requests it again. */
function clearEquipmentCatalog() {
  clearNuxtState('equipment-groups')
  clearNuxtData('load:equipment-groups')
}

/** A promise the test settles by hand, to look at the state while a request is in flight. */
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

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

describe('exercise library', () => {
  it('has an exercise that targets every muscle except the neck', () => {
    // No mocked exercise trains the neck until the exercise endpoints land (SPEC 07).
    const untargeted = MUSCLE_KEYS.filter(m => !EXERCISES.some(e => e.primary.includes(m)))
    expect(untargeted).toEqual(['neck'])
  })

  it('tags every exercise with at least one primary muscle and never lists a muscle twice', () => {
    for (const e of EXERCISES) {
      expect(e.primary.length, e.name).toBeGreaterThan(0)
      expect(new Set([...e.primary, ...e.secondary]).size, e.name).toBe(e.primary.length + e.secondary.length)
    }
    expect(new Set(EXERCISES.map(e => e.id)).size).toBe(EXERCISES.length)
  })

  it('tags the exercises that bias one part of a muscle', () => {
    const byName = (name: string) => EXERCISES.find(e => e.name === name)!
    expect(byName('Incline Dumbbell Press').primary).toEqual(['upper_chest'])
    expect(byName('Chest Dip').primary).toEqual(['lower_chest'])
    expect(byName('Seated Calf Raise').primary).toEqual(['soleus'])
    expect(byName('Standing Calf Raise Machine').primary).toEqual(['gastrocnemius'])
    expect(byName('Overhead Cable Extension').primary).toEqual(['triceps_long'])
  })
})

describe('useBodyMap', () => {
  it('starts on the front with all six groups on, in API order, and no exercises', async () => {
    const map = useBodyMap()
    await vi.waitUntil(() => map.equipmentReady.value)
    expect(map.view.value).toBe('front')
    expect(map.equipment.value).toEqual(GROUP_KEYS)
    expect(map.exercises.value).toEqual([])
  })

  it('turns on every group that arrives after it was created', async () => {
    clearEquipmentCatalog()
    const request = deferred<unknown>()
    mockCatalogs(() => request.promise)

    const map = useBodyMap()
    expect(map.equipmentReady.value).toBe(false)
    expect(map.equipment.value).toEqual([])

    request.resolve(equipmentGroupsResponse)
    await vi.waitUntil(() => map.equipmentReady.value)
    expect(map.equipment.value).toEqual(GROUP_KEYS)
  })

  it('doesn\'t look up exercises before the groups load', async () => {
    clearEquipmentCatalog()
    const request = deferred<unknown>()
    mockCatalogs(() => request.promise)
    const getExercises = vi.spyOn(trainingService, 'getExercises')

    const map = useBodyMap()
    map.select('lats')
    await settle()
    expect(getExercises).not.toHaveBeenCalled()
    expect(map.exercises.value).toEqual([])
    expect(map.loading.value).toBe(false)

    request.resolve(equipmentGroupsResponse)
    await vi.waitUntil(() => map.equipmentReady.value)
    await settle()
    expect(getExercises).toHaveBeenCalledWith('lats', GROUP_KEYS)
    expect(map.exercises.value.length).toBeGreaterThan(0)
  })

  it('lists exercises that target the muscle first, then the ones it assists in', async () => {
    const map = useBodyMap()
    map.select('upper_chest')
    await settle()
    const list = map.exercises.value
    expect(list.length).toBeGreaterThan(0)
    expect(list.every(e => e.primary.includes('upper_chest') || e.secondary.includes('upper_chest'))).toBe(true)
    const firstAssist = list.findIndex(e => !e.primary.includes('upper_chest'))
    expect(firstAssist).toBeGreaterThan(0)
    expect(list.slice(firstAssist).every(e => !e.primary.includes('upper_chest'))).toBe(true)
  })

  it('puts the most direct exercises first', async () => {
    const map = useBodyMap()
    map.select('lats')
    await settle()
    const names = map.exercises.value.map(e => e.name)
    expect(names.indexOf('Lat Pulldown')).toBeLessThan(names.indexOf('Dumbbell Pullover'))
    expect(map.exercises.value[0]!.primary).toEqual(['lats'])
  })

  it('filters by equipment and keeps API order when a group is turned back on', async () => {
    const map = useBodyMap()
    map.select('lower_chest')
    await settle()
    map.toggleEquipment('gym')
    await settle()
    expect(map.equipment.value).toEqual(['dumbbell', 'bodyweight', 'kettlebell', 'bands', 'accessories'])
    expect(map.exercises.value.length).toBeGreaterThan(0)
    expect(map.exercises.value.some(e => e.equipmentGroup === 'gym')).toBe(false)
    map.toggleEquipment('gym')
    expect(map.equipment.value).toEqual(GROUP_KEYS)
  })

  it('finds no exercises with only kettlebell on', async () => {
    const map = useBodyMap()
    map.select('lower_chest')
    await settle()
    for (const key of GROUP_KEYS.filter(k => k !== 'kettlebell')) map.toggleEquipment(key)
    await settle()
    expect(map.equipment.value).toEqual(['kettlebell'])
    expect(map.exercises.value).toEqual([])
  })

  it('shows nothing when every equipment type is off', async () => {
    const map = useBodyMap()
    map.select('quads')
    await settle()
    for (const key of GROUP_KEYS) map.toggleEquipment(key)
    await settle()
    expect(map.equipment.value).toEqual([])
    expect(map.exercises.value).toEqual([])
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

describe('exercise photos', () => {
  it('gives gym exercises photos of similar machines after their own start and end shots', async () => {
    const map = useBodyMap()
    map.select('lats')
    await settle()
    const pulldown = map.exercises.value.find(e => e.name === 'Lat Pulldown')!
    expect(pulldown.photos.length).toBeGreaterThan(2)
    expect(pulldown.photos.slice(0, 2).map(p => p.caption)).toEqual(['Start', 'End'])
    expect(pulldown.photos[2]!.caption).toBe('Close-Grip Front Lat Pulldown · start')
    for (const p of pulldown.photos) expect(p.src).toMatch(/^https:\/\/raw\.githubusercontent\.com\/yuhonas\/free-exercise-db\/main\/exercises\/[\w-]+\/[01]\.jpg$/)
  })

  it('leaves photos empty for an exercise without a match', async () => {
    const map = useBodyMap()
    map.select('front_delts')
    await settle()
    expect(map.exercises.value.find(e => e.name === 'Wall Handstand Hold')!.photos).toEqual([])
  })
})

describe('useTraining.addExercise', () => {
  it('appends a library exercise to today\'s workout', async () => {
    // Wipes today's workout, and the catalogs with it, so their loads run again too.
    clearNuxtState()
    clearNuxtData()
    const training = useTraining()
    const map = useBodyMap()
    map.select('lats')
    await settle()
    const pullUp = map.exercises.value.find(e => e.name === 'Pull-up')!
    expect(training.hasExercise('Pull-up')).toBe(false)
    await training.addExercise(pullUp, 'Bodyweight')
    expect(training.hasExercise('Pull-up')).toBe(true)
    expect(training.workout.value!.exercises.at(-1)).toMatchObject({ name: 'Pull-up', equip: 'Bodyweight' })
  })
})
