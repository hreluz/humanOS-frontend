import type { Workout } from '~/types/training'
import { delay } from './mocks/delay'
import { TODAY_WORKOUT } from './mocks/training'

export async function getTodayWorkout(): Promise<Workout> {
  await delay()
  return structuredClone(TODAY_WORKOUT)
}
