export type GoalKey = 'lose' | 'build' | 'maintain' | 'fitness'

export type ActivityLevel = 'Sedentary' | 'Light' | 'Moderate' | 'Very active'

export interface OnboardGoal {
  key: GoalKey
  label: string
  hint: string
  icon: string
}

// Numeric fields stay strings: they come straight from form inputs.
export interface UserProfile {
  goal: GoalKey
  age: string
  height: string
  weight: string
  target: string
  activity: ActivityLevel
}

export interface User extends UserProfile {
  name: string
  email: string
}

export interface SignupDraft {
  name: string
  email: string
  password: string
}
