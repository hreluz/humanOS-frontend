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
}

export type FoodSearchTab = 'all' | 'recent' | 'myfoods' | 'verified'

export interface RecipeIngredient extends Macros {
  name: string
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
