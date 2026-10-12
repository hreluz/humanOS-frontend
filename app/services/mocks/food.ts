import type { DailyTargets, FoodItem, FoodLog, MealPlan, RecipeDraft } from '~/types/food'

export const CATALOG: FoodItem[] = [
  { id: 'chicken_boiled', name: 'Chicken breast, boiled', brand: 'Generic', serving: '100g', per: 100, unit: 'g', step: 10, kcal: 150, p: 30, c: 0, f: 3.2 },
  { id: 'chicken_grilled', name: 'Chicken breast, grilled', brand: 'Generic', serving: '100g', per: 100, unit: 'g', step: 10, kcal: 165, p: 31, c: 0, f: 3.6 },
  { id: 'chicken_raw', name: 'Chicken breast, raw', brand: 'Generic', serving: '100g', per: 100, unit: 'g', step: 10, kcal: 120, p: 22, c: 0, f: 2.6 },
  { id: 'tj_chicken', name: "Trader Joe's Chicken Breast", brand: "Trader Joe's", serving: '1 serving (140g)', per: 1, unit: 'serving', step: 1, kcal: 190, p: 34, c: 1, f: 4 },
  { id: 'chicken_thigh', name: 'Chicken thigh, grilled', brand: 'Generic', serving: '100g', per: 100, unit: 'g', step: 10, kcal: 209, p: 26, c: 0, f: 11 },
  { id: 'egg_boiled', name: 'Egg, boiled', brand: 'Generic', serving: '1 egg', per: 1, unit: 'piece', pieceName: 'egg', step: 1, kcal: 78, p: 6.3, c: 0.6, f: 5.3 },
  { id: 'salmon_baked', name: 'Salmon, baked', brand: 'Generic', serving: '100g', per: 100, unit: 'g', step: 10, kcal: 206, p: 22, c: 0, f: 12 },
  { id: 'yogurt_plain', name: 'Greek yogurt, plain', brand: 'Generic', serving: '250g', per: 250, unit: 'g', step: 25, kcal: 220, p: 24, c: 12, f: 6 },
  { id: 'whey', name: 'Whey protein', brand: 'Optimum Nutrition', serving: '1 scoop (30g)', per: 1, unit: 'piece', pieceName: 'scoop', step: 1, kcal: 120, p: 24, c: 3, f: 1.5 },
  { id: 'oats', name: 'Rolled oats', brand: 'Generic', serving: '40g', per: 40, unit: 'g', step: 10, kcal: 150, p: 5, c: 27, f: 3 },
  { id: 'granola', name: 'Granola', brand: 'Generic', serving: '30g', per: 30, unit: 'g', step: 5, kcal: 115, p: 3, c: 18, f: 4 },
  { id: 'banana', name: 'Banana', brand: 'Generic', serving: '1 banana', per: 1, unit: 'piece', pieceName: 'banana', step: 1, kcal: 105, p: 1.3, c: 27, f: 0.4 },
  { id: 'rice_cooked', name: 'Jasmine rice, cooked', brand: 'Generic', serving: '150g', per: 150, unit: 'g', step: 25, kcal: 195, p: 4, c: 42, f: 0.5 },
  { id: 'olive_oil', name: 'Olive oil', brand: 'Generic', serving: '15ml', per: 15, unit: 'ml', step: 5, kcal: 120, p: 0, c: 0, f: 14 },
]

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

export const INITIAL_MY_FOODS: FoodItem[] = [
  { id: 'my_bowl', name: 'My chicken & rice bowl', brand: 'Custom recipe', serving: '1 bowl', per: 1, unit: 'serving', step: 1, kcal: 540, p: 38, c: 52, f: 14 },
]

export const INITIAL_RECIPE: RecipeDraft = {
  name: 'Chicken & Rice Bowl',
  servings: 1,
  ingredients: [
    { name: 'Chicken breast, grilled', kcal: 330, p: 62, c: 0, f: 7.2 },
    { name: 'Jasmine rice, cooked', kcal: 390, p: 8, c: 84, f: 1 },
    { name: 'Olive oil', kcal: 240, p: 0, c: 0, f: 28 },
  ],
}

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
