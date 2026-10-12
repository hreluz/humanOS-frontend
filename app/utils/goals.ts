import type { DailyMetric, Goal, GoalTemplate } from '~/types/goal'

export function formatGoalValue(tpl: GoalTemplate, value: number) {
  return (tpl.localeFormat ? value.toLocaleString('en-US') : String(value)) + tpl.unit
}

export function makeGoalLabel(tpl: GoalTemplate, value: number) {
  return tpl.labelTemplate
    .replace('{value}', formatGoalValue(tpl, value))
    .replace('{raw}', String(value))
}

export type DailyTotals = Record<DailyMetric, number>

export const METRIC_LABELS: Record<DailyMetric, string> = {
  protein: 'Protein', kcal: 'Calories', steps: 'Steps', activeKcal: 'Active calories', waterMl: 'Water',
}

/** "118g", "1,360 kcal", "6,200", "1.8L". */
export function formatMetric(metric: DailyMetric, value: number) {
  const n = Math.round(value).toLocaleString('en-US')
  switch (metric) {
    case 'protein': return `${n}g`
    case 'kcal':
    case 'activeKcal': return `${n} kcal`
    case 'steps': return n
    case 'waterMl': return `${Math.round(value / 100) / 10}L`
  }
}

export const metricPct = (value: number, target: number) => target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0

/** Progress of a daily goal from today's totals; goals without a metric keep their stored values. */
export function dailyGoalProgress(goal: Goal, totals: DailyTotals): { pct: number, sub: string } {
  if (!goal.metric || !goal.target) return { pct: goal.pct, sub: goal.sub }
  const value = totals[goal.metric]
  return { pct: metricPct(value, goal.target), sub: `${formatMetric(goal.metric, value)} today` }
}
