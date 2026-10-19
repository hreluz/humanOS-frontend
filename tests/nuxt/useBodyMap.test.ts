import { describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { MOCK_LATENCY_MS } from '~/services/mocks/delay'

const settle = async () => {
  await new Promise(r => setTimeout(r, MOCK_LATENCY_MS + 20))
  await flushPromises()
}

describe('useBodyMap', () => {
  it('starts on the front with every equipment type and no exercises', () => {
    const map = useBodyMap()
    expect(map.view.value).toBe('front')
    expect(map.equipment.value).toEqual(['gym', 'dumbbell', 'bodyweight'])
    expect(map.exercises.value).toEqual([])
  })

  it('loads exercises for exactly the picked muscle, within the equipment filter', async () => {
    const map = useBodyMap()
    map.select('chest')
    await settle()
    expect(map.exercises.value.length).toBeGreaterThan(0)
    expect(map.exercises.value.every(e => e.muscle === 'chest')).toBe(true)

    map.toggleEquipment('gym')
    await settle()
    expect(map.equipment.value).toEqual(['dumbbell', 'bodyweight'])
    expect(map.exercises.value.some(e => e.equipment === 'gym')).toBe(false)

    // Toggling back keeps the chip order stable.
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
    // Calves are on both sides, so the back view stays.
    map.select('calves')
    expect(map.view.value).toBe('back')
    map.select('abs')
    expect(map.view.value).toBe('front')
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
