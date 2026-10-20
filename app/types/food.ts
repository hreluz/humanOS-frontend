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
}

export type FoodLog = Record<MealKey, LoggedFood[]>

export interface Macros {
  kcal: number
  p: number
  c: number
  f: number
}

export type PortionUnit = 'g' | 'ml' | 'piece' | 'serving'

export type IngredientCategory = 'meat' | 'seafood' | 'eggs' | 'plant_protein' | 'dairy' | 'grains' | 'legumes' | 'vegetables' | 'fruit' | 'fats' | 'condiments' | 'supplements' | 'other'

export interface FoodItem extends Macros {
  id: string
  name: string
  brand: string
  serving: string
  /** Macros are for `per` of `unit` (e.g. 100 g, 1 egg). */
  per: number
  unit: PortionUnit
  /** Stepper increment when logging an amount. */
  step: number
  /** Name of one piece, e.g. 'egg' → "2 eggs". */
  pieceName?: string
  /** Only on recipes: what the whole batch is made of. */
  recipe?: { servings: number, ingredients: RecipeIngredient[] }
  /** USD for `per` of `unit` (e.g. 1.1 = $1.10 per 100 g). Absent when unknown (custom foods, recipes). */
  price?: number
  /** Food group. Set on every catalog item. Absent on custom foods saved without one, and on recipes. */
  category?: IngredientCategory
}

/** What the user types when creating a food that isn't in the catalog. */
export interface NewFoodInput extends Macros {
  name: string
  per: number
  unit: PortionUnit
  /** USD for `per` of `unit`, rounded to cents. Absent when the user left it blank. */
  price?: number
  /** Absent when the user left the select on "No category". */
  category?: IngredientCategory
}

export type FoodSearchTab = 'all' | 'recent' | 'myfoods' | 'verified'

/** The My foods page filter: every food, one category, or foods saved without a category. */
export type MyFoodsFilter = 'all' | 'none' | IngredientCategory

/** `amount` of `item`, in the item's unit. */
export interface RecipeIngredient {
  item: FoodItem
  amount: number
}

/** One basket line in the quick log; a recipe carries the ingredients of the portion being logged. */
export interface FoodLogEntry {
  item: FoodItem
  amount: number
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
