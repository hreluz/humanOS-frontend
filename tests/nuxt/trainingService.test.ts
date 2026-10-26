import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '~/services/api'
import type { ExerciseDef } from '~/types/training'
import { addExerciseToWorkout, getEquipmentGroups, getMuscleAreas } from '~/services/trainingService'

vi.mock('~/services/api')

const muscle = (key: string, label: string, body_view: 'front' | 'back') => ({ key, label, body_view })

beforeEach(() => {
  vi.resetAllMocks()
})

describe('getMuscleAreas', () => {
  it('calls the catalog endpoint and maps the response in API order', async () => {
    vi.mocked(api).mockResolvedValue({
      data: [
        { key: 'chest', label: 'Chest', muscles: [muscle('upper_chest', 'Upper chest', 'front'), muscle('lower_chest', 'Mid & lower chest', 'front')] },
        { key: 'back', label: 'Back', muscles: [muscle('neck', 'Neck', 'back'), muscle('upper_traps', 'Upper traps', 'back')] },
      ],
    })

    const areas = await getMuscleAreas()

    expect(api).toHaveBeenCalledWith('/v1/training/muscle-areas')
    expect(areas).toEqual([
      { key: 'chest', label: 'Chest', muscles: [{ key: 'upper_chest', label: 'Upper chest', view: 'front' }, { key: 'lower_chest', label: 'Mid & lower chest', view: 'front' }] },
      { key: 'back', label: 'Back', muscles: [{ key: 'neck', label: 'Neck', view: 'back' }, { key: 'upper_traps', label: 'Upper traps', view: 'back' }] },
    ])
  })

  it('drops muscles the figure can\'t draw, and areas left empty', async () => {
    vi.mocked(api).mockResolvedValue({
      data: [
        { key: 'shoulders', label: 'Shoulders', muscles: [muscle('rotator_cuff', 'Rotator cuff', 'back'), muscle('rear_delts', 'Rear delts', 'back')] },
        { key: 'hands', label: 'Hands', muscles: [muscle('grip', 'Grip', 'front')] },
      ],
    })

    expect(await getMuscleAreas()).toEqual([
      { key: 'shoulders', label: 'Shoulders', muscles: [{ key: 'rear_delts', label: 'Rear delts', view: 'back' }] },
    ])
  })

  it('passes API errors on', async () => {
    vi.mocked(api).mockRejectedValue({ statusCode: 500 })
    await expect(getMuscleAreas()).rejects.toEqual({ statusCode: 500 })
  })
})

describe('getEquipmentGroups', () => {
  it('calls the catalog endpoint and keeps group and equipment order', async () => {
    vi.mocked(api).mockResolvedValue({
      data: [
        { key: 'gym', label: 'Gym', equipment: [{ key: 'barbell', label: 'Barbell' }, { key: 'machine', label: 'Machine' }, { key: 'cable', label: 'Cable' }] },
        { key: 'dumbbell', label: 'Dumbbell', equipment: [{ key: 'dumbbell', label: 'Dumbbell' }] },
        { key: 'kettlebell', label: 'Kettlebell', equipment: [{ key: 'kettlebell', label: 'Kettlebell' }] },
      ],
    })

    const groups = await getEquipmentGroups()

    expect(api).toHaveBeenCalledWith('/v1/training/equipment-groups')
    expect(groups).toEqual([
      { key: 'gym', label: 'Gym', equipment: [{ key: 'barbell', label: 'Barbell' }, { key: 'machine', label: 'Machine' }, { key: 'cable', label: 'Cable' }] },
      { key: 'dumbbell', label: 'Dumbbell', equipment: [{ key: 'dumbbell', label: 'Dumbbell' }] },
      { key: 'kettlebell', label: 'Kettlebell', equipment: [{ key: 'kettlebell', label: 'Kettlebell' }] },
    ])
  })

  it('keeps a group without equipment, with an empty list', async () => {
    vi.mocked(api).mockResolvedValue({ data: [{ key: 'bodyweight', label: 'Bodyweight' }] })
    expect(await getEquipmentGroups()).toEqual([{ key: 'bodyweight', label: 'Bodyweight', equipment: [] }])
  })

  it('passes API errors on', async () => {
    vi.mocked(api).mockRejectedValue({ statusCode: 500 })
    await expect(getEquipmentGroups()).rejects.toEqual({ statusCode: 500 })
  })
})

describe('addExerciseToWorkout', () => {
  it('appends an entry with the label it is given', async () => {
    const def: ExerciseDef = { id: 'lat-pulldown', name: 'Lat Pulldown', primary: ['lats'], secondary: [], equipmentGroup: 'gym', cue: 'Elbows down.', photos: [] }

    const workout = await addExerciseToWorkout(def, 'Gym')

    expect(workout.exercises.at(-1)).toEqual({ name: 'Lat Pulldown', equip: 'Gym', sets: ['10 reps', '10 reps', '10 reps'] })
  })
})
