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

/** A group key from the equipment catalog API (`gym`, `kettlebell`, …). Exercises are tagged with one. */
export type EquipmentGroupKey = string

/** A piece of equipment from the catalog API. Not shown yet; kept so exercises can reference it later. */
export interface EquipmentDef {
  key: string
  label: string
}

/** An equipment group from the catalog API: one filter tab on the body map, with its equipment in display order. */
export interface EquipmentGroupDef {
  key: EquipmentGroupKey
  label: string
  equipment: EquipmentDef[]
}

export type BodyView = 'front' | 'back'

/** Which list the body map shows. Stretches are one API category, and exercises are all the others. */
export type ExerciseKind = 'exercises' | 'stretches'

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
  source: 'free_exercise_db' | 'wger'
  license: string
  /** Set only for wger photos. Must be shown when set. */
  author: string | null
  creditUrl: string | null
}

/** An exercise from the library, tagged with the exact muscles it trains. */
export interface ExerciseDef {
  key: string
  name: string
  /** Muscles the exercise mainly trains. */
  primary: MuscleKey[]
  /** Muscles that assist. */
  secondary: MuscleKey[]
  equipmentGroup: EquipmentGroupKey
  cue: string | null
  /** In display order, as the API sends them. */
  photos: ExercisePhoto[]
}

/** One page of exercises, and whether another page follows it. */
export interface ExercisePage {
  items: ExerciseDef[]
  hasMore: boolean
}
