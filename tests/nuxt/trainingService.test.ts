import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '~/services/api'
import type { ExerciseDef } from '~/types/training'
import { addExerciseToWorkout, getEquipmentGroups, getExercises, getMuscleAreas } from '~/services/trainingService'

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

describe('getExercises', () => {
  const resource = (over: Record<string, unknown> = {}) => ({
    key: 'barbell_bench_press',
    name: 'Barbell Bench Press',
    category: 'strength',
    level: 'beginner',
    mechanic: 'compound',
    force: 'push',
    cue: 'Bar to mid-chest.',
    equipment: 'barbell',
    equipment_group: 'gym',
    primary: ['lower_chest'],
    secondary: ['front_delts'],
    photos: [{ url: 'https://example.com/0.jpg', caption: 'Start', source: 'wger', license: 'CC-BY-SA', author: 'Ana', credit_url: 'https://example.com/ana' }],
    ...over,
  })
  const page = (data: unknown[], current_page = 1, last_page = 1) => ({ data, meta: { current_page, last_page } })

  it('asks for one muscle, one group and one page', async () => {
    vi.mocked(api).mockResolvedValue(page([]))
    await getExercises('lats', 'kettlebell', 3)
    expect(api).toHaveBeenCalledWith('/v1/training/exercises', { query: { 'muscle': 'lats', 'equipment_group[]': ['kettlebell'], 'page': 3, 'per_page': 50 } })
  })

  it('starts on page 1', async () => {
    vi.mocked(api).mockResolvedValue(page([]))
    await getExercises('lats', 'gym')
    expect(vi.mocked(api).mock.calls[0]![1]!.query!.page).toBe(1)
  })

  it('maps the response to app types', async () => {
    vi.mocked(api).mockResolvedValue(page([resource()]))
    const { items } = await getExercises('lower_chest', 'gym')
    expect(items).toEqual([{
      key: 'barbell_bench_press',
      name: 'Barbell Bench Press',
      primary: ['lower_chest'],
      secondary: ['front_delts'],
      equipmentGroup: 'gym',
      cue: 'Bar to mid-chest.',
      photos: [{ src: 'https://example.com/0.jpg', caption: 'Start', source: 'wger', license: 'CC-BY-SA', author: 'Ana', creditUrl: 'https://example.com/ana' }],
    }])
  })

  it('keeps the API\'s order', async () => {
    vi.mocked(api).mockResolvedValue(page([resource({ key: 'z', primary: ['lats'] }), resource({ key: 'a', primary: ['lats'] })]))
    expect((await getExercises('lats', 'gym')).items.map(e => e.key)).toEqual(['z', 'a'])
  })

  it('keeps a null cue and maps empty photos to an empty list', async () => {
    vi.mocked(api).mockResolvedValue(page([resource({ cue: null, photos: [] })]))
    const [exercise] = (await getExercises('lower_chest', 'gym')).items
    expect(exercise!.cue).toBeNull()
    expect(exercise!.photos).toEqual([])
  })

  it('drops muscle keys the figure can\'t draw', async () => {
    vi.mocked(api).mockResolvedValue(page([resource({ primary: ['grip', 'lats'], secondary: ['rotator_cuff', 'biceps'] })]))
    const [exercise] = (await getExercises('lats', 'gym')).items
    expect(exercise!.primary).toEqual(['lats'])
    expect(exercise!.secondary).toEqual(['biceps'])
  })

  it('says if another page follows', async () => {
    vi.mocked(api).mockResolvedValueOnce(page([], 1, 2)).mockResolvedValueOnce(page([], 2, 2))
    expect((await getExercises('lats', 'gym', 1)).hasMore).toBe(true)
    expect((await getExercises('lats', 'gym', 2)).hasMore).toBe(false)
  })

  it('passes API errors on', async () => {
    vi.mocked(api).mockRejectedValue({ statusCode: 500 })
    await expect(getExercises('lats', 'gym')).rejects.toEqual({ statusCode: 500 })
  })
})

describe('addExerciseToWorkout', () => {
  it('appends an entry with the label it is given', async () => {
    const def: ExerciseDef = { key: 'lat_pulldown', name: 'Lat Pulldown', primary: ['lats'], secondary: [], equipmentGroup: 'gym', cue: 'Elbows down.', photos: [] }

    const workout = await addExerciseToWorkout(def, 'Gym')

    expect(workout.exercises.at(-1)).toEqual({ name: 'Lat Pulldown', equip: 'Gym', sets: ['10 reps', '10 reps', '10 reps'] })
  })
})
