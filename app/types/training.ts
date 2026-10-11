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
