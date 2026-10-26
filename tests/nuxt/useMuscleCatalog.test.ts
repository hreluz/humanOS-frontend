import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MuscleAreaDef } from '~/types/training'
import * as trainingService from '~/services/trainingService'

vi.mock('~/services/trainingService')

const AREAS: MuscleAreaDef[] = [
  { key: 'chest', label: 'Chest', muscles: [{ key: 'upper_chest', label: 'Upper chest', view: 'front' }] },
  { key: 'back', label: 'Back', muscles: [{ key: 'neck', label: 'Neck', view: 'back' }, { key: 'lats', label: 'Lats', view: 'back' }] },
]

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

// The catalog is shared, loaded-once state, so each test clears it first.
beforeEach(() => {
  vi.resetAllMocks()
  clearNuxtState('muscle-areas')
  clearNuxtData('load:muscle-areas')
})

describe('useMuscleCatalog', () => {
  it('is pending until the catalog arrives, then exposes areas, labels and sides', async () => {
    const request = deferred<MuscleAreaDef[]>()
    vi.mocked(trainingService.getMuscleAreas).mockReturnValue(request.promise)

    const catalog = useMuscleCatalog()
    expect(catalog.pending.value).toBe(true)
    expect(catalog.areas.value).toEqual([])
    expect(catalog.label('neck')).toBe('')

    request.resolve(AREAS)
    await vi.waitUntil(() => !catalog.pending.value)
    expect(catalog.failed.value).toBe(false)
    expect(catalog.areas.value).toEqual(AREAS)
    expect(catalog.label('neck')).toBe('Neck')
    expect(catalog.viewOf('neck')).toBe('back')
    expect(catalog.labels.value).toEqual({ upper_chest: 'Upper chest', neck: 'Neck', lats: 'Lats' })
  })

  it('fails when the load is rejected', async () => {
    vi.mocked(trainingService.getMuscleAreas).mockRejectedValue(new Error('500'))

    const catalog = useMuscleCatalog()
    await vi.waitUntil(() => catalog.failed.value)
    expect(catalog.pending.value).toBe(false)
    expect(catalog.areas.value).toEqual([])
    expect(catalog.label('neck')).toBe('')
  })

  it('retries after a failure: pending while it runs, then filled', async () => {
    vi.mocked(trainingService.getMuscleAreas).mockRejectedValueOnce(new Error('500'))
    const catalog = useMuscleCatalog()
    await vi.waitUntil(() => catalog.failed.value)

    const request = deferred<MuscleAreaDef[]>()
    vi.mocked(trainingService.getMuscleAreas).mockReturnValue(request.promise)
    const done = catalog.retry()
    expect(catalog.pending.value).toBe(true)
    expect(catalog.failed.value).toBe(false)

    request.resolve(AREAS)
    await done
    expect(catalog.pending.value).toBe(false)
    expect(catalog.failed.value).toBe(false)
    expect(catalog.areas.value).toEqual(AREAS)
  })

  it('stays failed when the retry fails too', async () => {
    vi.mocked(trainingService.getMuscleAreas).mockRejectedValue(new Error('500'))
    const catalog = useMuscleCatalog()
    await vi.waitUntil(() => catalog.failed.value)

    await catalog.retry()
    expect(catalog.failed.value).toBe(true)
    expect(catalog.pending.value).toBe(false)
  })

  it('loads the catalog once and shares it', async () => {
    vi.mocked(trainingService.getMuscleAreas).mockResolvedValue(AREAS)

    const first = useMuscleCatalog()
    await vi.waitUntil(() => first.areas.value.length)
    const second = useMuscleCatalog()
    await new Promise(r => setTimeout(r, 20))

    expect(second.areas.value).toEqual(AREAS)
    expect(trainingService.getMuscleAreas).toHaveBeenCalledTimes(1)
  })
})
