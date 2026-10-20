import type { IngredientCategory } from '~/types/food'

/** Every ingredient category, in the order the create form lists them. */
export const CATEGORIES: { key: IngredientCategory, label: string }[] = [
  { key: 'meat', label: 'Meat & poultry' },
  { key: 'seafood', label: 'Seafood' },
  { key: 'eggs', label: 'Eggs' },
  { key: 'plant_protein', label: 'Plant protein' },
  { key: 'dairy', label: 'Dairy' },
  { key: 'grains', label: 'Grains & starches' },
  { key: 'legumes', label: 'Legumes' },
  { key: 'vegetables', label: 'Vegetables' },
  { key: 'fruit', label: 'Fruit' },
  { key: 'fats', label: 'Fats & nuts' },
  { key: 'condiments', label: 'Condiments & sweeteners' },
  { key: 'supplements', label: 'Supplements' },
  { key: 'other', label: 'Other' },
]

/** 'fats' → "Fats & nuts". */
export function categoryLabel(key: IngredientCategory): string {
  return CATEGORIES.find(c => c.key === key)!.label
}
