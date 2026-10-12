import type { Goal, GoalTemplate } from '~/types/goal'

export const INITIAL_GOALS: Goal[] = [
  { id: 'lose_fat', label: 'Lose fat — 82.1kg → 76kg', sub: '62%', pct: 62, accent: 'coral' },
  { id: 'protein', label: 'Eat 170g protein daily', sub: '6/7 days', pct: 86, accent: 'blue', metric: 'protein', target: 170 },
  { id: 'steps', label: 'Walk 10,000 steps', sub: '6,200 today', pct: 62, accent: 'green', metric: 'steps', target: 10000 },
  { id: 'bench', label: 'Bench press 100kg', sub: '92.5kg best', pct: 92, accent: 'violet' },
  { id: 'sleep', label: 'Sleep 8 hours', sub: '7.2h avg', pct: 90, accent: 'violet' },
  { id: 'water', label: 'Drink 3L water daily', sub: '1.8L today', pct: 60, accent: 'blue', metric: 'waterMl', target: 3000 },
  { id: 'calories', label: 'Eat 2,600 kcal daily', sub: '2,340 avg', pct: 90, accent: 'amber', metric: 'kcal', target: 2600 },
  { id: 'workouts', label: 'Train 5x per week', sub: '4/5 this week', pct: 80, accent: 'coral' },
  { id: 'active_kcal', label: 'Burn 500 active kcal daily', sub: '480 today', pct: 96, accent: 'green', metric: 'activeKcal', target: 500 },
  { id: 'vo2', label: 'Reach VO2 max 45', sub: '41.2 now', pct: 40, accent: 'blue' },
]

export const GOAL_TEMPLATES: GoalTemplate[] = [
  { key: 'protein', label: 'Daily protein', hint: 'Track grams of protein per day', defaultTarget: 170, step: 5, min: 20, icon: 'M12 2v20M6 8h12M4 14h16', accent: 'blue', unit: 'g', metric: 'protein', labelTemplate: 'Eat {value} protein daily' },
  { key: 'steps', label: 'Daily steps', hint: 'Track steps walked per day', defaultTarget: 10000, step: 500, min: 1000, icon: 'M13 3l-8 11h6l-1 7 8-11h-6l1-7z', accent: 'green', unit: '', localeFormat: true, metric: 'steps', labelTemplate: 'Walk {value} steps' },
  { key: 'bench', label: 'Bench press', hint: 'Track your 1-rep max', defaultTarget: 100, step: 2.5, min: 20, icon: 'M4 12h4m8 0h4M8 8v8m8-8v8', accent: 'violet', unit: 'kg', labelTemplate: 'Bench press {value}' },
  { key: 'sleep', label: 'Sleep', hint: 'Track hours of sleep per night', defaultTarget: 8, step: 0.5, min: 4, icon: 'M20 12.5A8.5 8.5 0 1111.5 4a6.5 6.5 0 008.5 8.5z', accent: 'violet', unit: 'h', labelTemplate: 'Sleep {raw} hours' },
  { key: 'water', label: 'Water intake', hint: 'Track liters of water per day', defaultTarget: 3, step: 0.25, min: 1, icon: 'M12 2s7 8 7 13a7 7 0 11-14 0c0-5 7-13 7-13z', accent: 'blue', unit: 'L', metric: 'waterMl', metricScale: 1000, labelTemplate: 'Drink {value} water daily' },
  { key: 'weight', label: 'Target weight', hint: 'Track progress toward a weight goal', defaultTarget: 76, step: 0.5, min: 40, icon: 'M4 12h4l2-7 4 14 2-7h4', accent: 'coral', unit: 'kg', labelTemplate: 'Reach {value}' },
  { key: 'calories', label: 'Daily calories', hint: 'Track calories eaten per day', defaultTarget: 2600, step: 50, min: 1200, icon: 'M12 3c1 3 5 5.5 5 10.5a5 5 0 01-10 0c0-2.5 1.5-4 2.5-5.5.5 1.5 1.5 2.5 2.5 2.5 0-2.5-1-5 0-7.5z', accent: 'amber', unit: ' kcal', localeFormat: true, metric: 'kcal', labelTemplate: 'Eat {value} daily' },
  { key: 'workouts', label: 'Weekly workouts', hint: 'Track training sessions per week', defaultTarget: 5, step: 1, min: 1, icon: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4M9 15l2 2 4-4', accent: 'coral', unit: 'x', labelTemplate: 'Train {value} per week' },
  { key: 'active_kcal', label: 'Active calories', hint: 'Track calories burned through activity', defaultTarget: 500, step: 25, min: 100, icon: 'M4 17l4-5 3 3 5-7 4 5', accent: 'green', unit: '', localeFormat: true, metric: 'activeKcal', labelTemplate: 'Burn {value} active kcal daily' },
  { key: 'vo2', label: 'VO2 max', hint: 'Track your cardio fitness', defaultTarget: 45, step: 0.5, min: 20, icon: 'M3 12h4l2-4 4 8 2-4h6', accent: 'blue', unit: '', labelTemplate: 'Reach VO2 max {value}' },
]
