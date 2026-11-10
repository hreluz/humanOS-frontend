export type MealKey = 'breakfast' | 'lunch' | 'dinner' | 'snacks'

export interface LoggedFood {
  name: string
  kcal: number
  p: number
  c: number
  f: number
  /** Amount eaten, e.g. "2 eggs"; seeded items carry it in the name. */
  portion?: string
  /** ISO time it was logged through the quick log; seeded items have none. */
  loggedAt?: string
  /** For a recipe: what went into the portion eaten, as logged (may differ from the saved recipe). */
  ingredients?: LoggedIngredient[]
}

export interface LoggedIngredient {
  ingredientId: string
  name: string
  amount: number
  unit: PortionUnit
  portion?: string
}

export type FoodLog = Record<MealKey, LoggedFood[]>

export interface Macros {
  kcal: number
  p: number
  c: number
  f: number
}

/** `g` for ingredients, `serving` for recipes. */
export type PortionUnit = 'g' | 'serving'

export type IngredientCategory = 'meat' | 'seafood' | 'eggs' | 'plant_protein' | 'dairy' | 'grains' | 'legumes' | 'vegetables' | 'fruit' | 'fats' | 'condiments' | 'supplements' | 'other'

export interface IngredientPortion {
  key: string
  label: string
  grams: number
}

export interface FoodPhoto {
  url: string
  thumbnailUrl: string
  license: string | null
  licenseUrl: string | null
  /** `null` for CC0 and public domain. */
  author: string | null
  creditUrl: string | null
}

export interface FoodItem extends Macros {
  /** The API `key` for ingredients (`egg_whole_hard_boiled`, `u_01jc…`), `recipe_…` for mocked recipes. */
  id: string
  name: string
  serving: string
  /** 100 for ingredients, 1 for recipes. */
  per: number
  unit: PortionUnit
  /** Stepper increment when logging an amount in the item's unit. */
  step: number
  /** True for the user's own ingredients and for recipes. */
  isMine: boolean
  /** Grams per 100 g. `null` means no data, left out of totals. Absent on recipes. */
  fiber?: number | null
  /** `[]` on recipes and on ingredients without portions. */
  portions: IngredientPortion[]
  /** In API order; the first is the thumbnail. `[]` on recipes and user ingredients. */
  photos: FoodPhoto[]
  /** Only on recipes: what the whole batch is made of. */
  recipe?: { servings: number, ingredients: RecipeIngredient[] }
  /** USD per 100 g, from the mock price store. Absent when unpriced. */
  price?: number
  /** Set on every ingredient, absent on recipes. */
  category?: IngredientCategory
}

/** What the form sends. Macros are per 100 g. */
export interface NewFoodInput {
  name: string
  category: IngredientCategory
  kcal: number
  p: number
  c: number
  f: number
  fiber: number | null
  /** `key` is set on portions that already exist, so an edit keeps them. */
  portions: { key?: string, label: string, grams: number }[]
  /** USD per 100 g. */
  price?: number
}

/** One page of the user's ingredients, and whether another page follows it. */
export interface FoodPage {
  items: FoodItem[]
  hasMore: boolean
}

export type FoodSearchTab = 'all' | 'recent' | 'myfoods'

/** The My foods page filter: every food, or one category. */
export type MyFoodsFilter = 'all' | IngredientCategory

/** `amount` of `item`: a count of `portion` when set, otherwise in the item's unit. */
export interface RecipeIngredient {
  item: FoodItem
  amount: number
  /** A key from `item.portions`. */
  portion?: string
}

/** One basket line in the quick log; a recipe carries the ingredients of the portion being logged. */
export interface FoodLogEntry {
  item: FoodItem
  amount: number
  portion?: string
  ingredients?: RecipeIngredient[]
}

export interface RecipeDraft {
  name: string
  servings: number
  ingredients: RecipeIngredient[]
}

export interface DailyTargets {
  kcal: number
  protein: number
  carbs: number
  fat: number
}

export interface PlannedMeal {
  label: string
  name: string
  kcal: number
}

export interface MealPlan {
  day: string
  date: number
  plannedKcal: number
  targetKcal: number
  meals: PlannedMeal[]
}
