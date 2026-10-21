import type { NewFoodInput } from '~/types/food'

/** Custom ingredients as the API would return them; `foodService` builds them with `buildFood`. */
export interface MockCustomFood extends NewFoodInput {
  id: string
}

export const MY_FOODS: MockCustomFood[] = [
  { id: 'myfood_protein_bar', name: 'Homemade protein bar', per: 1, unit: 'piece', kcal: 210, p: 15, c: 22, f: 7, price: 1.2, category: 'other' },
  { id: 'myfood_sourdough', name: 'Bakery sourdough', per: 100, unit: 'g', kcal: 260, p: 9, c: 51, f: 2, price: 0.8, category: 'grains' },
  { id: 'myfood_salsa_verde', name: 'Salsa verde', per: 100, unit: 'g', kcal: 45, p: 1, c: 8, f: 1, category: 'condiments' },
  { id: 'myfood_pesto', name: 'Basil pesto', per: 100, unit: 'g', kcal: 430, p: 5, c: 6, f: 43 },
]
