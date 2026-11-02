import { describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import BodyPage from '~/pages/body.vue'
import * as trainingService from '~/services/trainingService'

vi.mock('~/services/api')

describe('/body when the equipment catalog failed', () => {
  it('still lists stretches, and hides the equipment error', async () => {
    vi.spyOn(trainingService, 'getEquipmentGroups').mockRejectedValue({ statusCode: 500 })
    vi.spyOn(trainingService, 'getMuscleAreas').mockResolvedValue([{ key: 'back', label: 'Back', muscles: [{ key: 'lats', label: 'Lats', view: 'back' }] }])
    vi.spyOn(trainingService, 'getStretches').mockResolvedValue({
      items: [{ key: 'childs_pose', name: 'Child\'s Pose', primary: ['lats'], secondary: [], equipmentGroup: 'bodyweight', cue: null, photos: [] }],
      hasMore: false,
    })

    const page = await mountSuspended(BodyPage)
    await flushPromises()
    expect(page.text()).toContain('Couldn\'t load equipment.')

    await page.findAll('button').find(b => b.text() === 'Stretches')!.trigger('click')
    await page.findAll('button').find(b => b.text() === 'Lats')!.trigger('click')
    await flushPromises()

    expect(page.text()).not.toContain('Couldn\'t load equipment.')
    expect(page.text()).toContain('Child\'s Pose')
  })
})
