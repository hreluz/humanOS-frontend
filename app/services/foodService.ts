import type { components } from '~/types/api.generated'
import type { DailyTargets, FoodItem, FoodLog, FoodLogEntry, FoodPage, FoodSearchTab, MealKey, MealPlan, NewFoodInput, RecipeDraft, RecipeIngredient } from '~/types/food'
import { apiStatus } from '~/utils/apiErrors'
import { entryMacros, formatPortion, isSameDay, matchesQuery, sumMacros } from '~/utils/logging'
import { api } from './api'
import { delay } from './mocks/delay'
import { DAILY_TARGETS, INITIAL_FOOD_LOG, INITIAL_RECENT_RECIPE_IDS, INITIAL_RECIPE, PLANNER_DAYS, mealPlanFor } from './mocks/food'
import { INITIAL_PRICES } from './mocks/prices'
import { type MockRecipe, RECIPES } from './mocks/recipes'

type IngredientResource = components['schemas']['IngredientResource']

/** A plain deep copy; also works on the reactive objects callers pass in, which `structuredClone` rejects. */
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value))

/** The API's search needs at least this many characters; there is no browse. */
export const MIN_SEARCH_LENGTH = 3
const MY_FOODS_PER_PAGE = 100
const RECENT_LIMIT = 20

// Recipes, the food log, Recent and prices are still mocked (backend SPECs 19, 24, 25).
// Module-scoped copies stand in for the backend; callers only ever get clones.
const foodLog: FoodLog = structuredClone(INITIAL_FOOD_LOG)
const recipes: FoodItem[] = RECIPES.map(recipeToFood)
const prices = new Map<string, number>(Object.entries(INITIAL_PRICES))
/** Copies of what was logged, newest first. */
let recent: FoodItem[] = INITIAL_RECENT_RECIPE_IDS.map(id => recipes.find(r => r.id === id)!).map(r => structuredClone(r))

/** An ingredient from the API, per 100 g, with its price from the mock store. */
export function toFood(resource: IngredientResource): FoodItem {
  const { key, name, category, is_mine, per_100g, portions, photos } = resource
  const food: FoodItem = {
    id: key, name, serving: '100 g', per: 100, unit: 'g', step: 10, isMine: is_mine, category,
    kcal: per_100g.kcal, p: per_100g.protein, c: per_100g.carbs, f: per_100g.fat, fiber: per_100g.fiber,
    portions: portions.map(({ key, label, grams }) => ({ key, label, grams })),
    photos: photos.map(p => ({ url: p.url, thumbnailUrl: p.thumbnail_url, license: p.license, licenseUrl: p.license_url, author: p.author, creditUrl: p.credit_url })),
  }
  const price = prices.get(key)
  if (price !== undefined) food.price = price
  return food
}

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
 * Logs each entry to a meal at `loggedAt` (ISO, default now); returns today's log.
 * A recipe is logged with the ingredients of the portion eaten, so edits made while logging are kept; the saved recipe is left alone.
 */
export async function addFoodsToLog(entries: FoodLogEntry[], meal: MealKey, loggedAt = new Date().toISOString()): Promise<FoodLog> {
  await delay()
  for (const entry of entries) {
    const { item, amount, portion, ingredients } = entry
    foodLog[meal].push({
      name: item.name,
      portion: formatPortion(item, amount, portion),
      ...entryMacros(entry),
      loggedAt,
      ...ingredients && {
        ingredients: ingredients.map(i => ({ ingredientId: i.item.id, name: i.item.name, amount: i.amount, unit: i.item.unit, ...i.portion && { portion: i.portion } })),
      },
    })
  }
  const logged = entries.map(e => copy(e.item)).reverse()
  recent = [...logged, ...recent.filter(r => !logged.some(l => l.id === r.id))].slice(0, RECENT_LIMIT)
  return todayLog()
}

export async function getDailyTargets(): Promise<DailyTargets> {
  await delay()
  return { ...DAILY_TARGETS }
}

/** Catalog and own ingredients matching `query` (3–100 characters), in the API's rank order. */
export async function searchIngredients(query: string): Promise<FoodItem[]> {
  const { data } = await api<{ data: IngredientResource[] }>('/v1/nutrition/ingredients', { query: { search: query } })
  return data.map(toFood)
}

/**
 * The list a Quick log tab shows for `query`.
 * All: matching recipes, then the API search (not called below 3 characters). My foods: recipes newest first, then the
 * first page of the user's ingredients, filtered locally. Recent: in-memory copies, filtered locally.
 */
export async function searchFoods(query: string, tab: FoodSearchTab): Promise<FoodItem[]> {
  const q = query.trim()
  const ownRecipes = () => recipes.slice().reverse().filter(r => matchesQuery(r.name, q))
  if (tab === 'recent') {
    await delay()
    return structuredClone(recent.filter(i => matchesQuery(i.name, q)))
  }
  if (tab === 'myfoods') {
    const { items } = await getMyFoods(1)
    return [...structuredClone(ownRecipes()), ...items.filter(i => matchesQuery(i.name, q))]
  }
  if (q.length < MIN_SEARCH_LENGTH) return []
  return [...structuredClone(ownRecipes()), ...await searchIngredients(q)]
}

/** One page of the user's own ingredients, 100 per page, by name. */
export async function getMyFoods(page = 1): Promise<FoodPage> {
  const { data, meta } = await api<{ data: IngredientResource[], meta: { current_page: number, last_page: number } }>(
    '/v1/nutrition/my-ingredients', { query: { page, per_page: MY_FOODS_PER_PAGE } })
  return { items: data.map(toFood), hasMore: meta.current_page < meta.last_page }
}

/** The user's ingredient, or null on 404 or when it isn't theirs. Other errors are passed on. */
export async function getMyFood(key: string): Promise<FoodItem | null> {
  try {
    const { data } = await api<{ data: IngredientResource }>(`/v1/nutrition/ingredients/${encodeURIComponent(key)}`)
    return data.is_mine ? toFood(data) : null
  }
  catch (err) {
    if (apiStatus(err) === 404) return null
    throw err
  }
}

/** The API body for a form's food: macros per 100 g, and the full portions list. */
function toBody(input: NewFoodInput) {
  return {
    name: input.name.trim(),
    category: input.category,
    kcal: input.kcal,
    protein: input.p,
    carbs: input.c,
    fat: input.f,
    fiber: input.fiber,
    portions: input.portions.map(p => ({ ...p.key && { key: p.key }, label: p.label.trim(), grams: p.grams })),
  }
}

/** Keeps the form's price for `key`, or removes it when the form left it blank. */
function storePrice(key: string, price: number | undefined) {
  if (price === undefined) prices.delete(key)
  else prices.set(key, price)
}

/** Saves a food the user typed in to My foods. */
export async function createFood(input: NewFoodInput): Promise<FoodItem> {
  const { portions, ...body } = toBody(input)
  const { data } = await api<{ data: IngredientResource }>('/v1/nutrition/ingredients', {
    method: 'POST',
    body: { ...body, portions: portions.map(({ label, grams }) => ({ label, grams })) },
  })
  storePrice(data.key, input.price)
  return toFood(data)
}

/** Replaces the user's ingredient with what the form holds. Portions with a `key` are kept, the rest are new, and missing ones are removed. */
export async function updateFood(key: string, input: NewFoodInput): Promise<FoodItem> {
  const { data } = await api<{ data: IngredientResource }>(`/v1/nutrition/ingredients/${encodeURIComponent(key)}`, {
    method: 'PATCH',
    body: toBody(input),
  })
  storePrice(key, input.price)
  const food = toFood(data)
  recent = recent.map(r => r.id === key ? structuredClone(food) : r)
  return food
}

/** Deletes the user's ingredient, then its price and any Recent copy. Saved recipes and the log keep their copies. */
export async function deleteFood(key: string): Promise<void> {
  await api(`/v1/nutrition/ingredients/${encodeURIComponent(key)}`, { method: 'DELETE' })
  prices.delete(key)
  recent = recent.filter(r => r.id !== key)
}

export async function getRecipeDraft(): Promise<RecipeDraft> {
  await delay()
  return structuredClone(INITIAL_RECIPE)
}

export async function saveRecipe(recipe: RecipeDraft): Promise<FoodItem> {
  await delay()
  const lines = recipe.ingredients.map(i => ({ item: copy(i.item), amount: i.amount, ...i.portion && { portion: i.portion } }))
  const food = recipeFood('recipe_' + Date.now(), recipe.name, recipe.servings, lines)
  recipes.push(food)
  return structuredClone(food)
}

/** A recipe as a loggable My Foods item: one serving of its summed macros, plus what the whole batch is made of. */
function recipeFood(id: string, name: string, servings: number, ingredients: RecipeIngredient[]): FoodItem {
  const sum = sumMacros(ingredients)
  const per = (n: number) => Math.round(n / servings)
  return {
    id, name, serving: '1 serving', per: 1, unit: 'serving', step: 1, isMine: true, portions: [], photos: [],
    kcal: per(sum.kcal), p: per(sum.p), c: per(sum.c), f: per(sum.f),
    recipe: { servings, ingredients },
  }
}

function recipeToFood(recipe: MockRecipe): FoodItem {
  return recipeFood(recipe.id, recipe.name, recipe.servings, recipe.ingredients)
}

export async function getPlannerDays(): Promise<string[]> {
  await delay()
  return [...PLANNER_DAYS]
}

export async function getMealPlan(day: string): Promise<MealPlan> {
  await delay()
  return mealPlanFor(day)
}
