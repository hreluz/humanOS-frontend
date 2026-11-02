import type { components } from '~/types/api.generated'
import type { EquipmentGroupDef, EquipmentGroupKey, ExerciseDef, ExercisePage, MuscleAreaDef, MuscleKey, Workout } from '~/types/training'
import { isMuscleKey } from '~/utils/muscles'
import { api } from './api'
import { delay } from './mocks/delay'
import { TODAY_WORKOUT } from './mocks/training'

// Wire types come from the backend's OpenAPI contract (`pnpm gen:api`).
type MuscleAreaResource = components['schemas']['MuscleAreaResource']
type EquipmentGroupResource = components['schemas']['EquipmentGroupResource']
type ExerciseResource = components['schemas']['ExerciseResource']
type ExerciseCategory = components['schemas']['ExerciseCategory']

/** Exercises per `Load more`. */
const EXERCISES_PER_PAGE = 50

// A Record, so a new backend category fails typecheck after `pnpm gen:api` instead of silently leaving the list.
const NON_STRETCHING_CATEGORIES: Record<Exclude<ExerciseCategory, 'stretching'>, true> = {
  strength: true,
  powerlifting: true,
  olympic_weightlifting: true,
  strongman: true,
  plyometrics: true,
  cardio: true,
}
const EXERCISE_CATEGORIES = Object.keys(NON_STRETCHING_CATEGORIES)

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

/** The equipment catalog in display order. */
export function getEquipmentGroups(): Promise<EquipmentGroupDef[]> {
  return api<{ data: EquipmentGroupResource[] }>('/v1/training/equipment-groups').then(({ data }) =>
    data.map(group => ({
      key: group.key,
      label: group.label,
      equipment: (group.equipment ?? []).map(e => ({ key: e.key, label: e.label })),
    })),
  )
}

function toExercise(e: ExerciseResource): ExerciseDef {
  return {
    key: e.key,
    name: e.name,
    primary: e.primary.filter(isMuscleKey),
    secondary: e.secondary.filter(isMuscleKey),
    equipmentGroup: e.equipment_group,
    cue: e.cue,
    photos: (e.photos ?? []).map(p => ({
      src: p.url,
      caption: p.caption,
      source: p.source,
      license: p.license,
      author: p.author,
      creditUrl: p.credit_url,
    })),
  }
}

function requestExercises(query: Record<string, string | number | string[]>): Promise<ExercisePage> {
  return api<{ data: ExerciseResource[], meta: { current_page: number, last_page: number } }>('/v1/training/exercises', {
    query: { ...query, per_page: EXERCISES_PER_PAGE },
  }).then(({ data, meta }) => ({
    items: data.map(toExercise),
    hasMore: meta.current_page < meta.last_page,
  }))
}

/** One page of the non-stretching exercises that train `muscle` with `group`, in the API's order: the ones that target it first, then the ones it assists in. */
export function getExercises(muscle: MuscleKey, group: EquipmentGroupKey, page = 1): Promise<ExercisePage> {
  return requestExercises({ muscle, 'equipment_group[]': [group], 'category[]': EXERCISE_CATEGORIES, page })
}

/** One page of the stretches for `muscle`, with any equipment, in the API's order. */
export function getStretches(muscle: MuscleKey, page = 1): Promise<ExercisePage> {
  return requestExercises({ muscle, 'category[]': ['stretching'], page })
}

// Today's workout is still mocked.
// Module-scoped copy stands in for the backend; callers only ever get clones.
const workout: Workout = structuredClone(TODAY_WORKOUT)

/** Sets an exercise starts with when added from the library; the user fills in weights later. */
const DEFAULT_SETS = ['10 reps', '10 reps', '10 reps']

export async function getTodayWorkout(): Promise<Workout> {
  await delay()
  return structuredClone(workout)
}

/** Appends a library exercise to today's workout; `equip` is the label shown on the workout card. Returns the updated workout. */
export async function addExerciseToWorkout(def: ExerciseDef, equip: string): Promise<Workout> {
  await delay()
  workout.exercises.push({ name: def.name, equip, sets: [...DEFAULT_SETS] })
  return structuredClone(workout)
}
