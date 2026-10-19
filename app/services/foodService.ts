import type { DailyTargets, FoodItem, FoodLog, FoodSearchTab, Macros, MealKey, MealPlan, NewFoodInput, RecipeDraft } from '~/types/food'
import { buildFood, formatPortion, isSameDay, matchesQuery, scaleFood } from '~/utils/logging'
import { delay } from './mocks/delay'
import { DAILY_TARGETS, INITIAL_FOOD_LOG, INITIAL_RECENT_FOOD_IDS, INITIAL_RECIPE, PLANNER_DAYS, mealPlanFor } from './mocks/food'
import { INGREDIENTS } from './mocks/ingredients'
import { type MockRecipe, RECIPES } from './mocks/recipes'

// Module-scoped copies stand in for the backend; callers only ever get clones.
const foodLog: FoodLog = structuredClone(INITIAL_FOOD_LOG)
const myFoods: FoodItem[] = RECIPES.map(recipeToFood)
let recentIds: string[] = [...INITIAL_RECENT_FOOD_IDS]

const RECENT_LIMIT = 20

/** Today's food log; entries logged to another day are kept but left out. Seeded items (no time) count as today. */
function todayLog(): FoodLog {
  const now = new Date()
  const today = (meal: MealKey) => foodLog[meal].filter(i => !i.loggedAt || isSameDay(i.loggedAt, now))
  return structuredClone({ breakfast: today('breakfast'), lunch: today('lunch'), dinner: today('dinner'), snacks: today('snacks') })
}

export async function getFoodLog(): Promise<FoodLog> {
  await delay()
  return todayLog()
}

/** Logs `amount` of `item` (in the item's unit) to a meal at `loggedAt` (ISO, default now); returns today's log. */
export async function addFoodsToLog(entries: { item: FoodItem, amount: number }[], meal: MealKey, loggedAt = new Date().toISOString()): Promise<FoodLog> {
  await delay()
  for (const { item, amount } of entries) {
    foodLog[meal].push({ name: item.name, portion: formatPortion(item, amount), ...scaleFood(item, amount), loggedAt })
  }
  const logged = entries.map(e => e.item.id)
  recentIds = [...new Set([...logged.reverse(), ...recentIds])]
  return todayLog()
}

export async function getDailyTargets(): Promise<DailyTargets> {
  await delay()
  return { ...DAILY_TARGETS }
}

export async function searchFoods(query: string, tab: FoodSearchTab): Promise<FoodItem[]> {
  await delay()
  return structuredClone(foodsFor(tab).filter(i => matchesQuery(i.name, query)))
}

/** The list a search tab draws from; All puts the user's own foods (newest first) ahead of the catalog. */
function foodsFor(tab: FoodSearchTab): FoodItem[] {
  if (tab === 'myfoods') return myFoods
  if (tab === 'verified') return INGREDIENTS.filter(i => i.brand !== 'Generic')
  if (tab === 'recent') {
    const all = [...myFoods, ...INGREDIENTS]
    return recentIds.map(id => all.find(i => i.id === id)).filter(i => !!i).slice(0, RECENT_LIMIT)
  }
  return [...myFoods.slice().reverse(), ...INGREDIENTS]
}

/** Everything usable as a recipe ingredient: the user's own foods first, then the catalog. Recipes are left out. */
export async function getIngredientOptions(): Promise<FoodItem[]> {
  await delay()
  return structuredClone([...myFoods.filter(i => i.brand !== 'Custom recipe').reverse(), ...INGREDIENTS])
}

/** Saves a food the user typed in to My foods. */
export async function createFood(input: NewFoodInput): Promise<FoodItem> {
  await delay()
  const food = buildFood(input, 'food_' + Date.now())
  myFoods.push(food)
  return structuredClone(food)
}

export async function getRecipeDraft(): Promise<RecipeDraft> {
  await delay()
  return structuredClone(INITIAL_RECIPE)
}

export async function saveRecipe(recipe: RecipeDraft): Promise<FoodItem> {
  await delay()
  const sum = recipe.ingredients.reduce((a, i) => ({ kcal: a.kcal + i.kcal, p: a.p + i.p, c: a.c + i.c, f: a.f + i.f }), { kcal: 0, p: 0, c: 0, f: 0 })
  const food = recipeFood('recipe_' + Date.now(), recipe.name, recipe.servings, sum)
  myFoods.push(food)
  return structuredClone(food)
}

/** A recipe as a loggable My Foods item: one serving of its summed macros. */
function recipeFood(id: string, name: string, servings: number, sum: Macros): FoodItem {
  const per = (n: number) => Math.round(n / servings)
  return { id, name, brand: 'Custom recipe', serving: '1 serving', per: 1, unit: 'serving', step: 1, kcal: per(sum.kcal), p: per(sum.p), c: per(sum.c), f: per(sum.f) }
}

function recipeToFood(recipe: MockRecipe): FoodItem {
  const sum = recipe.ingredients.reduce((a, { ingredientId, amount }) => {
    const m = scaleFood(INGREDIENTS.find(i => i.id === ingredientId)!, amount)
    return { kcal: a.kcal + m.kcal, p: a.p + m.p, c: a.c + m.c, f: a.f + m.f }
  }, { kcal: 0, p: 0, c: 0, f: 0 })
  return recipeFood(recipe.id, recipe.name, recipe.servings, sum)
}

export async function getPlannerDays(): Promise<string[]> {
  await delay()
  return [...PLANNER_DAYS]
}

export async function getMealPlan(day: string): Promise<MealPlan> {
  await delay()
  return mealPlanFor(day)
}
