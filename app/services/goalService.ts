import type { Goal, GoalTemplate } from '~/types/goal'
import { makeGoalLabel } from '~/utils/goals'
import { delay } from './mocks/delay'
import { GOAL_TEMPLATES, INITIAL_GOALS } from './mocks/goals'

const goals: Goal[] = structuredClone(INITIAL_GOALS)

export async function getGoals(): Promise<Goal[]> {
  await delay()
  return structuredClone(goals)
}

export async function getGoalTemplates(): Promise<GoalTemplate[]> {
  await delay()
  return structuredClone(GOAL_TEMPLATES)
}

export async function createGoal(templateKey: string, target: number): Promise<Goal[]> {
  await delay()
  const tpl = GOAL_TEMPLATES.find(g => g.key === templateKey)
  if (!tpl) throw new Error(`Unknown goal template: ${templateKey}`)
  goals.push({ id: tpl.key + '_' + Date.now(), label: makeGoalLabel(tpl, target), sub: 'Just started', pct: 4, accent: tpl.accent })
  return structuredClone(goals)
}
