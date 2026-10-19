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
}

/** What the user types when creating a food that isn't in the catalog. */
export interface NewFoodInput extends Macros {
  name: string
  per: number
  unit: PortionUnit
}

export type FoodSearchTab = 'all' | 'recent' | 'myfoods' | 'verified'

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
