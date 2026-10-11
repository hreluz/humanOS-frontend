import type { ActivityLevel, GoalKey, OnboardGoal, UserProfile } from '~/types/auth'

export const ONBOARD_GOALS: OnboardGoal[] = [
  { key: 'lose', label: 'Lose fat', hint: 'Calorie deficit, keep muscle', icon: 'M4 12h4l2-7 4 14 2-7h4' },
  { key: 'build', label: 'Build muscle', hint: 'Small surplus, high protein', icon: 'M4 12h4m8 0h4M8 8v8m8-8v8' },
  { key: 'maintain', label: 'Maintain', hint: 'Hold weight, eat well', icon: 'M5 12h14' },
  { key: 'fitness', label: 'Get fitter', hint: 'Endurance, steps, sleep', icon: 'M13 3l-8 11h6l-1 7 8-11h-6l1-7z' },
]

export const ACTIVITY_LEVELS: ActivityLevel[] = ['Sedentary', 'Light', 'Moderate', 'Very active']

export function goalLabelFor(key: GoalKey | undefined) {
  return (ONBOARD_GOALS.find(g => g.key === key) ?? ONBOARD_GOALS[0]!).label
}

/** Lose/build goals need a target weight. */
export function goalNeedsTarget(key: GoalKey) {
  return key === 'lose' || key === 'build'
}

/** Age, height and weight are required; target weight only for goals that need one. */
export function profileStatsValid(p: Pick<UserProfile, 'goal' | 'age' | 'height' | 'weight' | 'target'>) {
  return +p.age > 0 && +p.height > 0 && +p.weight > 0 && (!goalNeedsTarget(p.goal) || +p.target > 0)
}
