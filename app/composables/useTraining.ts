import type { ExerciseDef } from '~/types/training'
import * as trainingService from '~/services/trainingService'

export function useTraining() {
  const { state: workout, pending } = useServiceState('today-workout', trainingService.getTodayWorkout)

  const hasExercise = (name: string) => !!workout.value?.exercises.some(e => e.name === name)

  /** Adds a library exercise to today's workout; `equip` is the equipment label shown on the workout card. */
  async function addExercise(def: ExerciseDef, equip: string) {
    workout.value = await trainingService.addExerciseToWorkout(def, equip)
  }

  return { workout, pending, hasExercise, addExercise }
}
