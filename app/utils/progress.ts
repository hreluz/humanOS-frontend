import type { GoalKey } from '~/types/auth'

export type DeltaTone = 'good' | 'bad' | 'neutral'

/** −0.4 → "−0.4 kg", 0.6 → "+0.6 kg", 0 → "No change". */
export function formatDelta(kg: number) {
  const r = Math.round(kg * 10) / 10
  if (r === 0) return 'No change'
  return `${r > 0 ? '+' : '−'}${Math.abs(r)} kg`
}

/** Whether a weight change moves toward the goal: down for lose, up for build. */
export function deltaTone(kg: number, goal: GoalKey | undefined): DeltaTone {
  const r = Math.round(kg * 10) / 10
  if (r === 0 || (goal !== 'lose' && goal !== 'build')) return 'neutral'
  return (goal === 'lose') === (r < 0) ? 'good' : 'bad'
}

export const DELTA_TONE_CLS: Record<DeltaTone, string> = {
  good: 'text-accent-green-strong dark:text-accent-green-dark',
  bad: 'text-accent-coral-strong dark:text-accent-coral-dark',
  neutral: 'text-black/55 dark:text-white/55',
}
