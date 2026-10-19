import { describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { BACK_MUSCLES, FRONT_MUSCLES } from 'body-muscles'
import type { MuscleKey } from '~/types/training'
import { MOCK_LATENCY_MS } from '~/services/mocks/delay'
import { EXERCISES } from '~/services/mocks/exercises'

const settle = async () => {
  await new Promise(r => setTimeout(r, MOCK_LATENCY_MS + 20))
  await flushPromises()
}

const ALL_MUSCLES = Object.keys(MUSCLE_LABELS) as MuscleKey[]

describe('muscle map', () => {
  it('maps every body-muscles region to a muscle or the plain silhouette', () => {
    const unmapped = [...FRONT_MUSCLES, ...BACK_MUSCLES]
      .filter(r => !muscleForRegion(r.id) && !NEUTRAL_REGION_IDS.has(regionBase(r.id)))
      .map(r => r.id)
    expect(unmapped).toEqual([])
  })

  it('draws every muscle on at least one side and lists it under one area', () => {
    for (const m of ALL_MUSCLES) {
      expect(isOnView(m, 'front') || isOnView(m, 'back'), m).toBe(true)
      expect(MUSCLE_AREAS.filter(a => a.muscles.includes(m)), m).toHaveLength(1)
    }
  })

  it('splits the chest into upper, mid & lower and serratus', () => {
    expect(MUSCLE_AREAS.find(a => a.area === 'chest')!.muscles).toEqual(['upperChest', 'lowerChest', 'serratus'])
    expect(isOnView('upperChest', 'front') && isOnView('lowerChest', 'front') && isOnView('serratus', 'front')).toBe(true)
  })
})

describe('exercise library', () => {
  it('has an exercise that targets every muscle', () => {
    const untargeted = ALL_MUSCLES.filter(m => !EXERCISES.some(e => e.primary.includes(m)))
    expect(untargeted).toEqual([])
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
    expect(byName('Incline Dumbbell Press').primary).toEqual(['upperChest'])
    expect(byName('Chest Dip').primary).toEqual(['lowerChest'])
    expect(byName('Seated Calf Raise').primary).toEqual(['soleus'])
    expect(byName('Standing Calf Raise Machine').primary).toEqual(['gastrocnemius'])
    expect(byName('Overhead Cable Extension').primary).toEqual(['tricepsLong'])
  })
})

describe('useBodyMap', () => {
  it('starts on the front with every equipment type and no exercises', () => {
    const map = useBodyMap()
    expect(map.view.value).toBe('front')
    expect(map.equipment.value).toEqual(['gym', 'dumbbell', 'bodyweight'])
    expect(map.exercises.value).toEqual([])
  })

  it('lists exercises that target the muscle first, then the ones it assists in', async () => {
    const map = useBodyMap()
    map.select('upperChest')
    await settle()
    const list = map.exercises.value
    expect(list.length).toBeGreaterThan(0)
    expect(list.every(e => e.primary.includes('upperChest') || e.secondary.includes('upperChest'))).toBe(true)
    const firstAssist = list.findIndex(e => !e.primary.includes('upperChest'))
    expect(firstAssist).toBeGreaterThan(0)
    expect(list.slice(firstAssist).every(e => !e.primary.includes('upperChest'))).toBe(true)
  })

  it('puts the most direct exercises first', async () => {
    const map = useBodyMap()
    map.select('lats')
    await settle()
    const names = map.exercises.value.map(e => e.name)
    expect(names.indexOf('Lat Pulldown')).toBeLessThan(names.indexOf('Dumbbell Pullover'))
    expect(map.exercises.value[0]!.primary).toEqual(['lats'])
  })

  it('filters by equipment and keeps the chip order stable', async () => {
    const map = useBodyMap()
    map.select('lowerChest')
    await settle()
    map.toggleEquipment('gym')
    await settle()
    expect(map.equipment.value).toEqual(['dumbbell', 'bodyweight'])
    expect(map.exercises.value.some(e => e.equipment === 'gym')).toBe(false)
    map.toggleEquipment('gym')
    expect(map.equipment.value).toEqual(['gym', 'dumbbell', 'bodyweight'])
  })

  it('shows nothing when every equipment type is off', async () => {
    const map = useBodyMap()
    map.select('quads')
    await settle()
    for (const key of ['gym', 'dumbbell', 'bodyweight'] as const) map.toggleEquipment(key)
    await settle()
    expect(map.exercises.value).toEqual([])
  })

  it('turns the figure around for a muscle only drawn on the other side', () => {
    const map = useBodyMap()
    map.select('lats')
    expect(map.view.value).toBe('back')
    map.select('upperAbs')
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
    map.select('frontDelts')
    await settle()
    expect(map.exercises.value.find(e => e.name === 'Wall Handstand Hold')!.photos).toEqual([])
  })
})

describe('useTraining.addExercise', () => {
  it('appends a library exercise to today\'s workout', async () => {
    clearNuxtState()
    const training = useTraining()
    const map = useBodyMap()
    map.select('lats')
    await settle()
    const pullUp = map.exercises.value.find(e => e.name === 'Pull-up')!
    expect(training.hasExercise('Pull-up')).toBe(false)
    await training.addExercise(pullUp)
    expect(training.hasExercise('Pull-up')).toBe(true)
    expect(training.workout.value!.exercises.at(-1)).toMatchObject({ name: 'Pull-up', equip: 'Bodyweight' })
  })
})
