import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '~/services/api'
import { getMuscleAreas } from '~/services/trainingService'

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
