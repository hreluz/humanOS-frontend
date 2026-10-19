import type { EquipmentKey, ExerciseDef, MuscleKey, Workout } from '~/types/training'
import { EQUIPMENT_LABELS } from '~/utils/muscles'
import { delay } from './mocks/delay'
import { EXERCISES } from './mocks/exercises'
import { TODAY_WORKOUT } from './mocks/training'

// Module-scoped copy stands in for the backend; callers only ever get clones.
const workout: Workout = structuredClone(TODAY_WORKOUT)

/** Sets an exercise starts with when added from the library; the user fills in weights later. */
const DEFAULT_SETS = ['10 reps', '10 reps', '10 reps']

export async function getTodayWorkout(): Promise<Workout> {
  await delay()
  return structuredClone(workout)
}

/** Library exercises that mainly work `muscle`, limited to the given equipment. */
export async function getExercises(muscle: MuscleKey, equipment: EquipmentKey[]): Promise<ExerciseDef[]> {
  await delay()
  return structuredClone(EXERCISES.filter(e => e.muscle === muscle && equipment.includes(e.equipment)))
}

/** Appends a library exercise to today's workout; returns the updated workout. */
export async function addExerciseToWorkout(def: ExerciseDef): Promise<Workout> {
  await delay()
  workout.exercises.push({ name: def.name, equip: EQUIPMENT_LABELS[def.equipment], sets: [...DEFAULT_SETS] })
  return structuredClone(workout)
}
