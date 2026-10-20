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
  = | 'upperChest' | 'lowerChest' | 'serratus'
    | 'frontDelts' | 'sideDelts' | 'rearDelts'
    | 'biceps' | 'tricepsLong' | 'tricepsLateral' | 'forearmFlexors' | 'forearmExtensors'
    | 'upperAbs' | 'lowerAbs' | 'obliques'
    | 'upperTraps' | 'midTraps' | 'lowerTraps' | 'lats' | 'lowerBack'
    | 'gluteMax' | 'gluteMed' | 'hipFlexors' | 'adductors' | 'quads'
    | 'hamstringsInner' | 'hamstringsOuter' | 'gastrocnemius' | 'soleus' | 'tibialis'

export type MuscleArea = 'chest' | 'shoulders' | 'arms' | 'core' | 'back' | 'legs'

export type EquipmentKey = 'gym' | 'dumbbell' | 'bodyweight'

export type BodyView = 'front' | 'back'

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
