import type { FoodItem } from '~/types/food'

export const INGREDIENTS: FoodItem[] = [
  // Protein
  { id: 'chicken_boiled', name: 'Chicken breast, boiled', brand: 'Generic', serving: '100g', per: 100, unit: 'g', step: 10, kcal: 150, p: 30, c: 0, f: 3.2, price: 1.1 },
  { id: 'chicken_grilled', name: 'Chicken breast, grilled', brand: 'Generic', serving: '100g', per: 100, unit: 'g', step: 10, kcal: 165, p: 31, c: 0, f: 3.6, price: 1.1 },
  { id: 'chicken_raw', name: 'Chicken breast, raw', brand: 'Generic', serving: '100g', per: 100, unit: 'g', step: 10, kcal: 120, p: 22, c: 0, f: 2.6, price: 0.99 },
  { id: 'tj_chicken', name: "Trader Joe's Chicken Breast", brand: "Trader Joe's", serving: '1 serving (140g)', per: 1, unit: 'serving', step: 1, kcal: 190, p: 34, c: 1, f: 4, price: 2.5 },
  { id: 'chicken_thigh', name: 'Chicken thigh, grilled', brand: 'Generic', serving: '100g', per: 100, unit: 'g', step: 10, kcal: 209, p: 26, c: 0, f: 11, price: 0.9 },
  { id: 'beef_ground', name: 'Ground beef 90/10, cooked', brand: 'Generic', serving: '100g', per: 100, unit: 'g', step: 10, kcal: 217, p: 26, c: 0, f: 12, price: 1.4 },
  { id: 'sirloin', name: 'Sirloin steak, grilled', brand: 'Generic', serving: '100g', per: 100, unit: 'g', step: 10, kcal: 206, p: 30, c: 0, f: 9, price: 2.2 },
  { id: 'turkey_breast', name: 'Turkey breast, roasted', brand: 'Generic', serving: '100g', per: 100, unit: 'g', step: 10, kcal: 135, p: 30, c: 0, f: 1, price: 1.5 },
  { id: 'salmon_baked', name: 'Salmon, baked', brand: 'Generic', serving: '100g', per: 100, unit: 'g', step: 10, kcal: 206, p: 22, c: 0, f: 12, price: 2.6 },
  { id: 'tuna_canned', name: 'Chunk light tuna in water', brand: 'StarKist', serving: '1 can (140g)', per: 140, unit: 'g', step: 10, kcal: 160, p: 36, c: 0, f: 1, price: 1.5 },
  { id: 'shrimp', name: 'Shrimp, cooked', brand: 'Generic', serving: '100g', per: 100, unit: 'g', step: 10, kcal: 99, p: 24, c: 0.2, f: 0.3, price: 2.2 },
  { id: 'tofu', name: 'Tofu, firm', brand: 'Generic', serving: '100g', per: 100, unit: 'g', step: 10, kcal: 144, p: 17, c: 3, f: 9, price: 0.55 },
  { id: 'egg_boiled', name: 'Egg, boiled', brand: 'Generic', serving: '1 egg', per: 1, unit: 'piece', pieceName: 'egg', step: 1, kcal: 78, p: 6.3, c: 0.6, f: 5.3, price: 0.4 },
  { id: 'egg_white', name: 'Egg white', brand: 'Generic', serving: '1 egg white', per: 1, unit: 'piece', pieceName: 'egg white', step: 1, kcal: 17, p: 3.6, c: 0.2, f: 0.1, price: 0.25 },
  { id: 'whey', name: 'Whey protein', brand: 'Optimum Nutrition', serving: '1 scoop (30g)', per: 1, unit: 'piece', pieceName: 'scoop', step: 1, kcal: 120, p: 24, c: 3, f: 1.5, price: 1.2 },

  // Dairy
  { id: 'yogurt_plain', name: 'Greek yogurt, plain', brand: 'Generic', serving: '250g', per: 250, unit: 'g', step: 25, kcal: 220, p: 24, c: 12, f: 6, price: 1.5 },
  { id: 'fage_yogurt', name: 'Fage Total 0% Greek Yogurt', brand: 'Fage', serving: '1 container (170g)', per: 1, unit: 'serving', step: 1, kcal: 90, p: 18, c: 5, f: 0, price: 1.6 },
  { id: 'cottage_cheese', name: 'Cottage cheese, 2%', brand: 'Generic', serving: '100g', per: 100, unit: 'g', step: 25, kcal: 84, p: 11, c: 4.3, f: 2.3, price: 0.55 },
  { id: 'milk_whole', name: 'Milk, whole', brand: 'Generic', serving: '1 cup (240ml)', per: 240, unit: 'ml', step: 30, kcal: 150, p: 8, c: 12, f: 8, price: 0.3 },
  { id: 'cheddar', name: 'Cheddar cheese', brand: 'Generic', serving: '30g', per: 30, unit: 'g', step: 5, kcal: 120, p: 7, c: 0.4, f: 10, price: 0.45 },
  { id: 'mozzarella', name: 'Mozzarella, fresh', brand: 'Generic', serving: '30g', per: 30, unit: 'g', step: 5, kcal: 85, p: 6, c: 1, f: 6, price: 0.6 },

  // Grains, starches & legumes
  { id: 'oats', name: 'Rolled oats', brand: 'Generic', serving: '40g', per: 40, unit: 'g', step: 10, kcal: 150, p: 5, c: 27, f: 3, price: 0.15 },
  { id: 'granola', name: 'Granola', brand: 'Generic', serving: '30g', per: 30, unit: 'g', step: 5, kcal: 115, p: 3, c: 18, f: 4, price: 0.35 },
  { id: 'rice_cooked', name: 'Jasmine rice, cooked', brand: 'Generic', serving: '150g', per: 150, unit: 'g', step: 25, kcal: 195, p: 4, c: 42, f: 0.5, price: 0.2 },
  { id: 'brown_rice', name: 'Brown rice, cooked', brand: 'Generic', serving: '150g', per: 150, unit: 'g', step: 25, kcal: 165, p: 3.8, c: 34, f: 1.3, price: 0.25 },
  { id: 'quinoa', name: 'Quinoa, cooked', brand: 'Generic', serving: '150g', per: 150, unit: 'g', step: 25, kcal: 180, p: 6.6, c: 32, f: 2.9, price: 0.6 },
  { id: 'barilla_spaghetti', name: 'Barilla Spaghetti, dry', brand: 'Barilla', serving: '56g', per: 56, unit: 'g', step: 14, kcal: 200, p: 7, c: 42, f: 1, price: 0.2 },
  { id: 'dkb_bread', name: "Dave's Killer Bread 21 Whole Grains", brand: "Dave's Killer Bread", serving: '1 slice', per: 1, unit: 'piece', pieceName: 'slice', step: 1, kcal: 110, p: 5, c: 22, f: 1.5, price: 0.45 },
  { id: 'tortilla', name: 'Flour tortilla', brand: 'Generic', serving: '1 tortilla', per: 1, unit: 'piece', pieceName: 'tortilla', step: 1, kcal: 140, p: 4, c: 24, f: 3.5, price: 0.3 },
  { id: 'sweet_potato', name: 'Sweet potato, baked', brand: 'Generic', serving: '100g', per: 100, unit: 'g', step: 25, kcal: 90, p: 2, c: 21, f: 0.2, price: 0.3 },
  { id: 'black_beans', name: 'Black beans, cooked', brand: 'Generic', serving: '100g', per: 100, unit: 'g', step: 25, kcal: 132, p: 8.9, c: 24, f: 0.5, price: 0.3 },
  { id: 'chickpeas', name: 'Chickpeas, cooked', brand: 'Generic', serving: '100g', per: 100, unit: 'g', step: 25, kcal: 164, p: 8.9, c: 27, f: 2.6, price: 0.35 },
  { id: 'lentils', name: 'Lentils, cooked', brand: 'Generic', serving: '100g', per: 100, unit: 'g', step: 25, kcal: 116, p: 9, c: 20, f: 0.4, price: 0.25 },

  // Vegetables
  { id: 'broccoli', name: 'Broccoli, steamed', brand: 'Generic', serving: '100g', per: 100, unit: 'g', step: 25, kcal: 35, p: 2.4, c: 7, f: 0.4, price: 0.5 },
  { id: 'spinach', name: 'Spinach, raw', brand: 'Generic', serving: '30g', per: 30, unit: 'g', step: 10, kcal: 7, p: 0.9, c: 1.1, f: 0.1, price: 0.4 },
  { id: 'greens', name: 'Mixed greens', brand: 'Generic', serving: '50g', per: 50, unit: 'g', step: 10, kcal: 10, p: 1, c: 2, f: 0.1, price: 0.7 },
  { id: 'bell_pepper', name: 'Bell pepper, red', brand: 'Generic', serving: '1 pepper', per: 1, unit: 'piece', pieceName: 'pepper', step: 1, kcal: 37, p: 1.2, c: 7, f: 0.4, price: 1.5 },
  { id: 'tomato', name: 'Tomato', brand: 'Generic', serving: '1 tomato', per: 1, unit: 'piece', pieceName: 'tomato', step: 1, kcal: 22, p: 1.1, c: 4.8, f: 0.2, price: 0.6 },
  { id: 'onion', name: 'Onion', brand: 'Generic', serving: '100g', per: 100, unit: 'g', step: 25, kcal: 40, p: 1.1, c: 9, f: 0.1, price: 0.25 },
  { id: 'carrot', name: 'Carrot', brand: 'Generic', serving: '100g', per: 100, unit: 'g', step: 25, kcal: 41, p: 0.9, c: 10, f: 0.2, price: 0.2 },
  { id: 'avocado', name: 'Avocado', brand: 'Generic', serving: '1 avocado', per: 1, unit: 'piece', pieceName: 'avocado', step: 1, kcal: 240, p: 3, c: 13, f: 22, price: 1.25 },

  // Fruit
  { id: 'banana', name: 'Banana', brand: 'Generic', serving: '1 banana', per: 1, unit: 'piece', pieceName: 'banana', step: 1, kcal: 105, p: 1.3, c: 27, f: 0.4, price: 0.25 },
  { id: 'apple', name: 'Apple', brand: 'Generic', serving: '1 apple', per: 1, unit: 'piece', pieceName: 'apple', step: 1, kcal: 95, p: 0.5, c: 25, f: 0.3, price: 0.8 },
  { id: 'blueberries', name: 'Blueberries', brand: 'Generic', serving: '100g', per: 100, unit: 'g', step: 25, kcal: 57, p: 0.7, c: 14, f: 0.3, price: 1.6 },

  // Fats, nuts & extras
  { id: 'olive_oil', name: 'Olive oil', brand: 'Generic', serving: '15ml', per: 15, unit: 'ml', step: 5, kcal: 120, p: 0, c: 0, f: 14, price: 0.3 },
  { id: 'butter', name: 'Butter', brand: 'Generic', serving: '1 tbsp (14g)', per: 14, unit: 'g', step: 7, kcal: 100, p: 0.1, c: 0, f: 11, price: 0.15 },
  { id: 'peanut_butter', name: 'Jif Creamy Peanut Butter', brand: 'Jif', serving: '2 tbsp (32g)', per: 32, unit: 'g', step: 8, kcal: 190, p: 7, c: 7, f: 16, price: 0.25 },
  { id: 'almonds', name: 'Almonds', brand: 'Generic', serving: '28g', per: 28, unit: 'g', step: 7, kcal: 164, p: 6, c: 6, f: 14, price: 0.6 },
  { id: 'honey', name: 'Honey', brand: 'Generic', serving: '1 tbsp (21g)', per: 21, unit: 'g', step: 7, kcal: 64, p: 0, c: 17, f: 0, price: 0.3 },
  { id: 'soy_sauce', name: 'Kikkoman Soy Sauce', brand: 'Kikkoman', serving: '1 tbsp (15ml)', per: 15, unit: 'ml', step: 5, kcal: 10, p: 1.3, c: 0.8, f: 0, price: 0.1 },
]
