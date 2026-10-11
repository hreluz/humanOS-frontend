export type MealKey = 'breakfast' | 'lunch' | 'dinner' | 'snacks'

export interface LoggedFood {
  name: string
  kcal: number
}

export type FoodLog = Record<MealKey, LoggedFood[]>

export interface Macros {
  kcal: number
  p: number
  c: number
  f: number
}

export interface FoodItem extends Macros {
  id: string
  name: string
  brand: string
  serving: string
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

export interface MacroIntake {
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
