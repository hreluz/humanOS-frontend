import type { DailyTargets, FoodItem, FoodLog, FoodLogEntry, FoodSearchTab, MealKey, MealPlan, NewFoodInput, RecipeDraft, RecipeIngredient } from '~/types/food'
import { buildFood, entryMacros, formatPortion, isSameDay, matchesQuery, sumMacros } from '~/utils/logging'
import { delay } from './mocks/delay'
import { DAILY_TARGETS, INITIAL_FOOD_LOG, INITIAL_RECENT_FOOD_IDS, INITIAL_RECIPE, PLANNER_DAYS, mealPlanFor } from './mocks/food'
import { INGREDIENTS } from './mocks/ingredients'
import { MY_FOODS } from './mocks/myFoods'
import { type MockRecipe, RECIPES } from './mocks/recipes'

// Module-scoped copies stand in for the backend; callers only ever get clones.
const foodLog: FoodLog = structuredClone(INITIAL_FOOD_LOG)
const myFoods: FoodItem[] = [...RECIPES.map(recipeToFood), ...MY_FOODS.map(f => buildFood(f, f.id))]
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

/**
 * Logs `amount` of `item` (in the item's unit) to a meal at `loggedAt` (ISO, default now); returns today's log.
 * A recipe is logged with the ingredients of the portion eaten, so edits made while logging are kept; the saved recipe is left alone.
 */
export async function addFoodsToLog(entries: FoodLogEntry[], meal: MealKey, loggedAt = new Date().toISOString()): Promise<FoodLog> {
  await delay()
  for (const entry of entries) {
    const { item, amount, ingredients } = entry
    foodLog[meal].push({
      name: item.name,
      portion: formatPortion(item, amount),
      ...entryMacros(entry),
      loggedAt,
      ...ingredients && { ingredients: ingredients.map(i => ({ ingredientId: i.item.id, name: i.item.name, amount: i.amount, unit: i.item.unit })) },
    })
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
  return structuredClone([...myFoods.filter(i => !i.recipe).reverse(), ...INGREDIENTS])
}

/** Saves a food the user typed in to My foods. */
export async function createFood(input: NewFoodInput): Promise<FoodItem> {
  await delay()
  const food = buildFood(input, 'food_' + Date.now())
  myFoods.push(food)
  return structuredClone(food)
}

/** The user's custom ingredients (no recipes), newest first. */
export async function getMyFoods(): Promise<FoodItem[]> {
  await delay()
  return structuredClone(myFoods.filter(i => !i.recipe).reverse())
}

/** One custom ingredient, or null when the id is unknown or belongs to a recipe. */
export async function getMyFood(id: string): Promise<FoodItem | null> {
  await delay()
  const food = findCustomFood(id)
  return food ? structuredClone(food) : null
}

/** Replaces a custom ingredient with what the user typed, keeping its id and place. Saved recipes and the log keep their copies. */
export async function updateFood(id: string, input: NewFoodInput): Promise<FoodItem> {
  await delay()
  const index = customFoodIndex(id)
  const food = buildFood(input, id)
  myFoods[index] = food
  return structuredClone(food)
}

/** Removes a custom ingredient from My foods and Recent. Saved recipes and the log keep their copies. */
export async function deleteFood(id: string): Promise<void> {
  await delay()
  myFoods.splice(customFoodIndex(id), 1)
  recentIds = recentIds.filter(r => r !== id)
}

function findCustomFood(id: string): FoodItem | undefined {
  return myFoods.find(i => i.id === id && !i.recipe)
}

function customFoodIndex(id: string): number {
  const index = myFoods.findIndex(i => i.id === id && !i.recipe)
  if (index === -1) throw new Error(`No custom food with id ${id}`)
  return index
}

export async function getRecipeDraft(): Promise<RecipeDraft> {
  await delay()
  return structuredClone(INITIAL_RECIPE)
}

export async function saveRecipe(recipe: RecipeDraft): Promise<FoodItem> {
  await delay()
  const food = recipeFood('recipe_' + Date.now(), recipe.name, recipe.servings, recipe.ingredients.map(i => ({ item: { ...i.item }, amount: i.amount })))
  myFoods.push(food)
  return structuredClone(food)
}

/** A recipe as a loggable My Foods item: one serving of its summed macros, plus what the whole batch is made of. */
function recipeFood(id: string, name: string, servings: number, ingredients: RecipeIngredient[]): FoodItem {
  const sum = sumMacros(ingredients)
  const per = (n: number) => Math.round(n / servings)
  return {
    id, name, brand: 'Custom recipe', serving: '1 serving', per: 1, unit: 'serving', step: 1,
    kcal: per(sum.kcal), p: per(sum.p), c: per(sum.c), f: per(sum.f),
    recipe: { servings, ingredients },
  }
}

function recipeToFood(recipe: MockRecipe): FoodItem {
  const ingredients = recipe.ingredients.map(({ ingredientId, amount }) => ({ item: INGREDIENTS.find(i => i.id === ingredientId)!, amount }))
  return recipeFood(recipe.id, recipe.name, recipe.servings, ingredients)
}

export async function getPlannerDays(): Promise<string[]> {
  await delay()
  return [...PLANNER_DAYS]
}

export async function getMealPlan(day: string): Promise<MealPlan> {
  await delay()
  return mealPlanFor(day)
}
