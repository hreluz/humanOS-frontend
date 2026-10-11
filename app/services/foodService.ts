import type { DailyTargets, FoodItem, FoodLog, FoodSearchTab, MacroIntake, MealKey, MealPlan, RecipeDraft } from '~/types/food'
import { delay } from './mocks/delay'
import { CATALOG, DAILY_TARGETS, INITIAL_FOOD_LOG, INITIAL_MY_FOODS, INITIAL_RECIPE, MACRO_INTAKE, PLANNER_DAYS, mealPlanFor } from './mocks/food'

// Module-scoped copies stand in for the backend; callers only ever get clones.
const foodLog: FoodLog = structuredClone(INITIAL_FOOD_LOG)
const myFoods: FoodItem[] = structuredClone(INITIAL_MY_FOODS)

export async function getFoodLog(): Promise<FoodLog> {
  await delay()
  return structuredClone(foodLog)
}

export async function addFoodToLog(item: FoodItem, meal: MealKey = 'snacks'): Promise<FoodLog> {
  await delay()
  foodLog[meal].push({ name: item.name, kcal: item.kcal })
  return structuredClone(foodLog)
}

export async function getDailyTargets(): Promise<DailyTargets> {
  await delay()
  return { ...DAILY_TARGETS }
}

export async function getMacroIntake(): Promise<MacroIntake> {
  await delay()
  return { ...MACRO_INTAKE }
}

export async function searchFoods(query: string, tab: FoodSearchTab): Promise<FoodItem[]> {
  await delay()
  let results = tab === 'myfoods' ? myFoods : CATALOG
  if (tab === 'verified') results = CATALOG.filter(i => i.brand !== 'Generic')
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length) results = results.filter(i => words.every(w => i.name.toLowerCase().includes(w)))
  return structuredClone(results)
}

export async function getCatalog(): Promise<FoodItem[]> {
  await delay()
  return structuredClone(CATALOG)
}

export async function getRecipeDraft(): Promise<RecipeDraft> {
  await delay()
  return structuredClone(INITIAL_RECIPE)
}

export async function saveRecipe(recipe: RecipeDraft): Promise<FoodItem> {
  await delay()
  const sum = recipe.ingredients.reduce((a, i) => ({ kcal: a.kcal + i.kcal, p: a.p + i.p, c: a.c + i.c, f: a.f + i.f }), { kcal: 0, p: 0, c: 0, f: 0 })
  const per = (n: number) => Math.round(n / recipe.servings)
  const food: FoodItem = {
    id: 'recipe_' + Date.now(), name: recipe.name, brand: 'Custom recipe', serving: '1 serving',
    kcal: per(sum.kcal), p: per(sum.p), c: per(sum.c), f: per(sum.f),
  }
  myFoods.push(food)
  return structuredClone(food)
}

export async function getPlannerDays(): Promise<string[]> {
  await delay()
  return [...PLANNER_DAYS]
}

export async function getMealPlan(day: string): Promise<MealPlan> {
  await delay()
  return mealPlanFor(day)
}
