import type { GoalTemplate } from '~/types/goal'

export function formatGoalValue(tpl: GoalTemplate, value: number) {
  return (tpl.localeFormat ? value.toLocaleString('en-US') : String(value)) + tpl.unit
}

export function makeGoalLabel(tpl: GoalTemplate, value: number) {
  return tpl.labelTemplate
    .replace('{value}', formatGoalValue(tpl, value))
    .replace('{raw}', String(value))
}
