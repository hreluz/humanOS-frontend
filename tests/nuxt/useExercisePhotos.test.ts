import { beforeEach, describe, expect, it } from 'vitest'
import type { ExerciseDef } from '~/types/training'

const photo = (n: number) => ({ src: `https://example.com/${n}.jpg`, caption: `Photo ${n}` })
const pulldown: ExerciseDef = {
  id: 'lat-pulldown', name: 'Lat Pulldown', primary: ['lats'], secondary: [], equipmentGroup: 'gym', cue: 'Elbows down.',
  photos: [photo(0), photo(1), photo(2)],
}

beforeEach(() => clearNuxtState())

describe('useExercisePhotos', () => {
  it('opens the viewer on the given photo', () => {
    const viewer = useExercisePhotos()
    viewer.openPhotos(pulldown, 1)
    expect(useModal().current.value).toBe('exercisePhotos')
    expect(viewer.current.value).toEqual(photo(1))
  })

  it('wraps around in both directions', () => {
    const viewer = useExercisePhotos()
    viewer.openPhotos(pulldown)
    viewer.prev()
    expect(viewer.index.value).toBe(2)
    viewer.next()
    expect(viewer.index.value).toBe(0)
    viewer.goTo(4)
    expect(viewer.index.value).toBe(1)
  })
})
