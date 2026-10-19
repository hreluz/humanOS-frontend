import type { DailyTargets, FoodLog, MealPlan, RecipeDraft } from '~/types/food'

export const INITIAL_FOOD_LOG: FoodLog = {
  breakfast: [
    { name: 'Greek yogurt, 250g', kcal: 220, p: 24, c: 12, f: 6 },
    { name: 'Blueberries, 1 serving', kcal: 85, p: 1, c: 21, f: 0.5 },
    { name: 'Granola, 30g', kcal: 115, p: 3, c: 18, f: 4 },
  ],
  lunch: [
    { name: 'Chicken breast, 200g', kcal: 330, p: 62, c: 0, f: 7 },
    { name: 'Jasmine rice, 150g', kcal: 195, p: 4, c: 42, f: 0.5 },
    { name: 'Olive oil, 1 tbsp', kcal: 85, p: 0, c: 0, f: 9.5 },
  ],
  dinner: [],
  snacks: [{ name: 'Protein bar', kcal: 210, p: 20, c: 22, f: 7 }, { name: 'Almonds, 20g', kcal: 120, p: 4, c: 4, f: 10 }],
}

/** Food ids logged most recently, newest first. */
export const INITIAL_RECENT_FOOD_IDS = ['yogurt_plain', 'granola', 'chicken_grilled', 'rice_cooked', 'olive_oil', 'overnight_oats', 'banana']

export const INITIAL_RECIPE: RecipeDraft = { name: '', servings: 1, ingredients: [] }

export const DAILY_TARGETS: DailyTargets = { kcal: 2600, protein: 170, carbs: 260, fat: 80 }

export const PLANNER_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function mealPlanFor(day: string): MealPlan {
  return {
    day,
    date: PLANNER_DAYS.indexOf(day) + 1,
    plannedKcal: 2180,
    targetKcal: DAILY_TARGETS.kcal,
    meals: [
      { label: 'Breakfast', name: 'Greek yogurt & granola', kcal: 420 },
      { label: 'Lunch', name: 'Chicken & Rice Bowl', kcal: 610 },
      { label: 'Dinner', name: 'Salmon & vegetables', kcal: 720 },
    ],
  }
}
