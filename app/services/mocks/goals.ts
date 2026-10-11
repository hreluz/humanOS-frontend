import type { Goal, GoalTemplate } from '~/types/goal'

export const INITIAL_GOALS: Goal[] = [
  { id: 'lose_fat', label: 'Lose fat — 82.1kg → 76kg', sub: '62%', pct: 62, accent: 'coral' },
  { id: 'protein', label: 'Eat 170g protein daily', sub: '6/7 days', pct: 86, accent: 'blue' },
  { id: 'steps', label: 'Walk 10,000 steps', sub: '6,200 today', pct: 62, accent: 'green' },
  { id: 'bench', label: 'Bench press 100kg', sub: '92.5kg best', pct: 92, accent: 'violet' },
]

export const GOAL_TEMPLATES: GoalTemplate[] = [
  { key: 'protein', label: 'Daily protein', hint: 'Track grams of protein per day', defaultTarget: 170, step: 5, min: 20, icon: 'M12 2v20M6 8h12M4 14h16', accent: 'blue', unit: 'g', labelTemplate: 'Eat {value} protein daily' },
  { key: 'steps', label: 'Daily steps', hint: 'Track steps walked per day', defaultTarget: 10000, step: 500, min: 1000, icon: 'M13 3l-8 11h6l-1 7 8-11h-6l1-7z', accent: 'green', unit: '', localeFormat: true, labelTemplate: 'Walk {value} steps' },
  { key: 'bench', label: 'Bench press', hint: 'Track your 1-rep max', defaultTarget: 100, step: 2.5, min: 20, icon: 'M4 12h4m8 0h4M8 8v8m8-8v8', accent: 'violet', unit: 'kg', labelTemplate: 'Bench press {value}' },
  { key: 'sleep', label: 'Sleep', hint: 'Track hours of sleep per night', defaultTarget: 8, step: 0.5, min: 4, icon: 'M20 12.5A8.5 8.5 0 1111.5 4a6.5 6.5 0 008.5 8.5z', accent: 'violet', unit: 'h', labelTemplate: 'Sleep {raw} hours' },
  { key: 'water', label: 'Water intake', hint: 'Track liters of water per day', defaultTarget: 3, step: 0.25, min: 1, icon: 'M12 2s7 8 7 13a7 7 0 11-14 0c0-5 7-13 7-13z', accent: 'blue', unit: 'L', labelTemplate: 'Drink {value} water daily' },
  { key: 'weight', label: 'Target weight', hint: 'Track progress toward a weight goal', defaultTarget: 76, step: 0.5, min: 40, icon: 'M4 12h4l2-7 4 14 2-7h4', accent: 'coral', unit: 'kg', labelTemplate: 'Reach {value}' },
]
