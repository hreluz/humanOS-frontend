import type { DailyTargets, FoodItem, FoodLog, MacroIntake, MealPlan, RecipeDraft } from '~/types/food'

export const CATALOG: FoodItem[] = [
  { id: 'chicken_grilled', name: 'Chicken breast, grilled', brand: 'Generic', serving: '100g', kcal: 165, p: 31, c: 0, f: 3.6 },
  { id: 'chicken_raw', name: 'Chicken breast, raw', brand: 'Generic', serving: '100g', kcal: 120, p: 22, c: 0, f: 2.6 },
  { id: 'tj_chicken', name: "Trader Joe's Chicken Breast", brand: "Trader Joe's", serving: '1 serving (140g)', kcal: 190, p: 34, c: 1, f: 4 },
  { id: 'chicken_thigh', name: 'Chicken thigh, grilled', brand: 'Generic', serving: '100g', kcal: 209, p: 26, c: 0, f: 11 },
  { id: 'yogurt_plain', name: 'Greek yogurt, plain', brand: 'Generic', serving: '250g', kcal: 220, p: 24, c: 12, f: 6 },
  { id: 'granola', name: 'Granola', brand: 'Generic', serving: '30g', kcal: 115, p: 3, c: 18, f: 4 },
  { id: 'rice_cooked', name: 'Jasmine rice, cooked', brand: 'Generic', serving: '150g', kcal: 195, p: 4, c: 42, f: 0.5 },
  { id: 'olive_oil', name: 'Olive oil', brand: 'Generic', serving: '1 tbsp', kcal: 120, p: 0, c: 0, f: 14 },
]

export const INITIAL_FOOD_LOG: FoodLog = {
  breakfast: [{ name: 'Greek yogurt, 250g', kcal: 220 }, { name: 'Blueberries, 1 serving', kcal: 85 }, { name: 'Granola, 30g', kcal: 115 }],
  lunch: [{ name: 'Chicken breast, 200g', kcal: 330 }, { name: 'Jasmine rice, 150g', kcal: 195 }, { name: 'Olive oil, 1 tbsp', kcal: 85 }],
  dinner: [],
  snacks: [{ name: 'Protein bar', kcal: 210 }, { name: 'Almonds, 20g', kcal: 120 }],
}

export const INITIAL_MY_FOODS: FoodItem[] = [
  { id: 'my_bowl', name: 'My chicken & rice bowl', brand: 'Custom recipe', serving: '1 bowl', kcal: 540, p: 38, c: 52, f: 14 },
]

export const INITIAL_RECIPE: RecipeDraft = {
  name: 'Chicken & Rice Bowl',
  servings: 2,
  ingredients: [
    { name: 'Chicken breast, grilled', kcal: 330, p: 62, c: 0, f: 7.2 },
    { name: 'Jasmine rice, cooked', kcal: 390, p: 8, c: 84, f: 1 },
    { name: 'Olive oil', kcal: 240, p: 0, c: 0, f: 28 },
  ],
}

export const DAILY_TARGETS: DailyTargets = { kcal: 2600, protein: 170, carbs: 260, fat: 80 }

// The design hardcodes today's macros; only calories are summed from the log.
export const MACRO_INTAKE: MacroIntake = { protein: 92, carbs: 140, fat: 48 }

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
