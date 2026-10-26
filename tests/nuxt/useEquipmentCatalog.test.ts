import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { EquipmentGroupDef } from '~/types/training'
import * as trainingService from '~/services/trainingService'

vi.mock('~/services/trainingService')

const GROUPS: EquipmentGroupDef[] = [
  { key: 'gym', label: 'Gym', equipment: [{ key: 'barbell', label: 'Barbell' }, { key: 'machine', label: 'Machine' }] },
  { key: 'dumbbell', label: 'Dumbbell', equipment: [{ key: 'dumbbell', label: 'Dumbbell' }] },
  { key: 'bodyweight', label: 'Bodyweight', equipment: [] },
  { key: 'kettlebell', label: 'Kettlebell', equipment: [{ key: 'kettlebell', label: 'Kettlebell' }] },
  { key: 'bands', label: 'Bands', equipment: [{ key: 'band', label: 'Band' }] },
  { key: 'accessories', label: 'Accessories', equipment: [{ key: 'bench', label: 'Bench' }] },
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
  clearNuxtState('equipment-groups')
  clearNuxtData('load:equipment-groups')
})

describe('useEquipmentCatalog', () => {
  it('is pending until the catalog arrives, then exposes the groups and their labels', async () => {
    const request = deferred<EquipmentGroupDef[]>()
    vi.mocked(trainingService.getEquipmentGroups).mockReturnValue(request.promise)

    const catalog = useEquipmentCatalog()
    expect(catalog.pending.value).toBe(true)
    expect(catalog.groups.value).toEqual([])
    expect(catalog.label('kettlebell')).toBe('')

    request.resolve(GROUPS)
    await vi.waitUntil(() => !catalog.pending.value)
    expect(catalog.failed.value).toBe(false)
    expect(catalog.groups.value).toHaveLength(6)
    expect(catalog.groups.value).toEqual(GROUPS)
    expect(catalog.label('kettlebell')).toBe('Kettlebell')
  })

  it('returns an empty label for a key the API doesn\'t know', async () => {
    vi.mocked(trainingService.getEquipmentGroups).mockResolvedValue(GROUPS)

    const catalog = useEquipmentCatalog()
    await vi.waitUntil(() => catalog.groups.value.length)
    expect(catalog.label('unknown')).toBe('')
  })

  it('fails when the load is rejected, and a retry fills the groups', async () => {
    vi.mocked(trainingService.getEquipmentGroups).mockRejectedValueOnce(new Error('500'))
    const catalog = useEquipmentCatalog()
    await vi.waitUntil(() => catalog.failed.value)
    expect(catalog.pending.value).toBe(false)
    expect(catalog.groups.value).toEqual([])

    vi.mocked(trainingService.getEquipmentGroups).mockResolvedValue(GROUPS)
    await catalog.retry()
    expect(catalog.failed.value).toBe(false)
    expect(catalog.pending.value).toBe(false)
    expect(catalog.groups.value).toEqual(GROUPS)
  })

  it('loads the catalog once and shares it', async () => {
    vi.mocked(trainingService.getEquipmentGroups).mockResolvedValue(GROUPS)

    const first = useEquipmentCatalog()
    await vi.waitUntil(() => first.groups.value.length)
    const second = useEquipmentCatalog()
    await new Promise(r => setTimeout(r, 20))

    expect(second.groups.value).toEqual(GROUPS)
    expect(trainingService.getEquipmentGroups).toHaveBeenCalledTimes(1)
  })
})
