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

export type MuscleKey = 'chest' | 'shoulders' | 'biceps' | 'triceps' | 'forearms' | 'abs' | 'obliques'
  | 'traps' | 'lats' | 'lowerBack' | 'glutes' | 'quads' | 'hamstrings' | 'calves'

export type EquipmentKey = 'gym' | 'dumbbell' | 'bodyweight'

export type BodyView = 'front' | 'back'

export interface ExercisePhoto {
  src: string
  caption: string
}

/** An exercise from the library, recommended by the muscle it mainly works. */
export interface ExerciseDef {
  id: string
  name: string
  muscle: MuscleKey
  equipment: EquipmentKey
  cue: string
  /** The exercise's start and end positions first, then close variants (similar machines). */
  photos: ExercisePhoto[]
}
