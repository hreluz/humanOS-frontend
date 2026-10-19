import type { ExerciseDef } from '~/types/training'
import * as trainingService from '~/services/trainingService'

export function useTraining() {
  const { state: workout, pending } = useServiceState('today-workout', trainingService.getTodayWorkout)

  const hasExercise = (name: string) => !!workout.value?.exercises.some(e => e.name === name)

  async function addExercise(def: ExerciseDef) {
    workout.value = await trainingService.addExerciseToWorkout(def)
  }

  return { workout, pending, hasExercise, addExercise }
}
