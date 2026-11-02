import { mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ExercisePhotos from '~/components/modal/ExercisePhotos.vue'
import { api } from '~/services/api'
import type { ExerciseDef, ExercisePhoto } from '~/types/training'

vi.mock('~/services/api')

const photo = (over: Partial<ExercisePhoto> = {}): ExercisePhoto => ({
  src: 'https://example.com/0.jpg', caption: 'Start', source: 'free_exercise_db', license: 'Unlicense', author: null, creditUrl: null, ...over,
})
const exercise = (over: Partial<ExerciseDef> = {}): ExerciseDef => ({
  key: 'lat_pulldown', name: 'Lat Pulldown', primary: ['lats'], secondary: [], equipmentGroup: 'gym', cue: 'Elbows down.', photos: [photo()], ...over,
})

async function mountWith(def: ExerciseDef) {
  useExercisePhotos().openPhotos(def)
  return mountSuspended(ExercisePhotos)
}

beforeEach(() => {
  clearNuxtState()
  clearNuxtData()
  vi.mocked(api).mockResolvedValue({ data: [{ key: 'gym', label: 'Gym', equipment: [] }] })
})

describe('ExercisePhotos', () => {
  it('credits free-exercise-db for its photos', async () => {
    const wrapper = await mountWith(exercise())
    expect(wrapper.text()).toContain('free-exercise-db (public domain)')
    expect(wrapper.text()).not.toContain('Photo:')
  })

  it('shows the author and license of a wger photo, linked to its source', async () => {
    const wrapper = await mountWith(exercise({ photos: [photo({ source: 'wger', license: 'CC-BY-SA', author: 'Ana', creditUrl: 'https://example.com/ana' })] }))
    expect(wrapper.text()).toContain('Photo: Ana (CC-BY-SA)')
    expect(wrapper.find('a[href="https://example.com/ana"]').text()).toBe('Ana')
    expect(wrapper.text()).not.toContain('free-exercise-db')
  })

  it('shows the author without a link when there is no source URL', async () => {
    const wrapper = await mountWith(exercise({ photos: [photo({ source: 'wger', license: 'CC-BY-SA', author: 'Ana' })] }))
    expect(wrapper.text()).toContain('Photo: Ana (CC-BY-SA)')
    expect(wrapper.findAll('a')).toHaveLength(0)
  })

  it('leaves the cue out of the subtitle when it is null', async () => {
    const wrapper = await mountWith(exercise({ cue: null }))
    expect(wrapper.text()).not.toContain('·')
  })
})
