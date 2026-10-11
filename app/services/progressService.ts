import type { WeighIn } from '~/types/progress'
import { delay } from './mocks/delay'

// No progress API yet: the hook persists weigh-ins locally. Swap for an api() call once it exists.
export async function saveWeighIn(entry: WeighIn): Promise<WeighIn> {
  await delay()
  return entry
}
