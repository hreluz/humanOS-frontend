import type { components } from '~/types/api.generated'
import type { EquipmentKey, ExerciseDef, ExercisePhoto, MuscleAreaDef, MuscleKey, Workout } from '~/types/training'
import { EQUIPMENT_LABELS, isMuscleKey } from '~/utils/muscles'
import { api } from './api'
import { delay } from './mocks/delay'
import { EXERCISES, type MockExercise } from './mocks/exercises'
import { TODAY_WORKOUT } from './mocks/training'

// Wire types come from the backend's OpenAPI contract (`pnpm gen:api`).
type MuscleAreaResource = components['schemas']['MuscleAreaResource']

/** The muscle catalog in display order. Muscles the figure can't draw are dropped, and so are areas left empty. */
export function getMuscleAreas(): Promise<MuscleAreaDef[]> {
  return api<{ data: MuscleAreaResource[] }>('/v1/training/muscle-areas').then(({ data }) =>
    data
      .map(area => ({
        key: area.key,
        label: area.label,
        muscles: (area.muscles ?? []).flatMap(m => isMuscleKey(m.key) ? [{ key: m.key, label: m.label, view: m.body_view }] : []),
      }))
      .filter(area => area.muscles.length),
  )
}

// Exercises and today's workout are still mocked.
// Module-scoped copy stands in for the backend; callers only ever get clones.
const workout: Workout = structuredClone(TODAY_WORKOUT)

/** Sets an exercise starts with when added from the library; the user fills in weights later. */
const DEFAULT_SETS = ['10 reps', '10 reps', '10 reps']

export async function getTodayWorkout(): Promise<Workout> {
  await delay()
  return structuredClone(workout)
}

/** Exercise photos come from free-exercise-db (public domain): two per exercise, start and end position. */
export const EXERCISE_PHOTO_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises'

/** `Triceps_Pushdown_-_Rope_Attachment` → `Triceps Pushdown, Rope Attachment` */
const photoIdLabel = (id: string) => id.replace(/_-_/g, ', ').replace(/_/g, ' ')

function toPhotos(photoIds: string[]): ExercisePhoto[] {
  return photoIds.flatMap((id, i) => {
    const [start, end] = i === 0 ? ['Start', 'End'] : [`${photoIdLabel(id)} · start`, `${photoIdLabel(id)} · end`]
    return [{ src: `${EXERCISE_PHOTO_BASE}/${id}/0.jpg`, caption: start }, { src: `${EXERCISE_PHOTO_BASE}/${id}/1.jpg`, caption: end }]
  })
}

function toExercise({ photoIds, ...rest }: MockExercise): ExerciseDef {
  return { ...rest, photos: toPhotos(photoIds) }
}

/**
 * Library exercises that train `muscle` with the given equipment: the ones that target it first, then the ones it assists in.
 * Targeting exercises are ordered most direct first: the muscle listed first, then the fewest other main muscles.
 */
export async function getExercises(muscle: MuscleKey, equipment: EquipmentKey[]): Promise<ExerciseDef[]> {
  await delay()
  const available = EXERCISES.filter(e => equipment.includes(e.equipment))
  const targeting = available
    .filter(e => e.primary.includes(muscle))
    .sort((a, b) => a.primary.indexOf(muscle) - b.primary.indexOf(muscle) || a.primary.length - b.primary.length)
  return [...targeting, ...available.filter(e => e.secondary.includes(muscle))].map(toExercise)
}

/** Appends a library exercise to today's workout; returns the updated workout. */
export async function addExerciseToWorkout(def: ExerciseDef): Promise<Workout> {
  await delay()
  workout.exercises.push({ name: def.name, equip: EQUIPMENT_LABELS[def.equipment], sets: [...DEFAULT_SETS] })
  return structuredClone(workout)
}
