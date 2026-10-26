export interface Exercise {
  name: string
  equip: string
  sets: string[]
}

export interface CardioSession {
  name: string
  detail: string
  icon: string
}

export interface Workout {
  title: string
  durationMin: number
  volume: string
  exercises: Exercise[]
  cardio: CardioSession[]
}

export type MuscleKey
  = | 'upper_chest' | 'lower_chest' | 'serratus'
    | 'front_delts' | 'side_delts' | 'rear_delts'
    | 'biceps' | 'triceps_long' | 'triceps_lateral' | 'forearm_flexors' | 'forearm_extensors'
    | 'upper_abs' | 'lower_abs' | 'obliques'
    | 'neck' | 'upper_traps' | 'mid_traps' | 'lower_traps' | 'lats' | 'lower_back'
    | 'glute_max' | 'glute_med' | 'hip_flexors' | 'adductors' | 'quads'
    | 'hamstrings_inner' | 'hamstrings_outer' | 'gastrocnemius' | 'soleus' | 'tibialis'

export type EquipmentKey = 'gym' | 'dumbbell' | 'bodyweight'

export type BodyView = 'front' | 'back'

/** A muscle from the catalog API. `view` is the side the figure turns to when the muscle is picked. */
export interface MuscleDef {
  key: MuscleKey
  label: string
  view: BodyView
}

/** A body area from the catalog API, with its muscles in display order. */
export interface MuscleAreaDef {
  key: string
  label: string
  muscles: MuscleDef[]
}

export interface ExercisePhoto {
  src: string
  caption: string
}

/** An exercise from the library, tagged with the exact muscles it trains. */
export interface ExerciseDef {
  id: string
  name: string
  /** Muscles the exercise mainly trains. */
  primary: MuscleKey[]
  /** Muscles that assist. */
  secondary: MuscleKey[]
  equipment: EquipmentKey
  cue: string
  /** The exercise's start and end positions first, then close variants (similar machines). */
  photos: ExercisePhoto[]
}
