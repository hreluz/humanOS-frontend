import type { FoodItem, IngredientCategory, RecipeIngredient } from '~/types/food'

/** A saved recipe as the recipes API will return it: each line carries its own copy of the ingredient, amounts in grams. */
export interface MockRecipe {
  id: string
  name: string
  servings: number
  ingredients: RecipeIngredient[]
}

/** A catalog ingredient as it was when the recipe was saved: key and per-100 g values from the backend seed data. */
function ingredient(id: string, name: string, category: IngredientCategory, kcal: number, p: number, c: number, f: number, fiber: number | null): FoodItem {
  return { id, name, serving: '100 g', per: 100, unit: 'g', step: 10, isMine: false, kcal, p, c, f, fiber, portions: [], photos: [], category }
}

// The catalog entries the seeded recipes use (backend `database/data/ingredients/*.json`).
const I = {
  oats: ingredient('oats_rolled', 'Oats, rolled, dry', 'grains', 379, 13.2, 67.7, 6.52, 10.1),
  milk: ingredient('milk_whole', 'Milk, whole', 'dairy', 60, 3.27, 4.63, 3.2, 0),
  blueberries: ingredient('blueberries', 'Blueberries', 'fruit', 57, 0.74, 14.5, 0.33, 2.4),
  honey: ingredient('honey', 'Honey', 'condiments', 304, 0.3, 82.4, 0, 0.2),
  eggWhite: ingredient('egg_white_raw', 'Egg white, raw', 'eggs', 55, 10.7, 2.36, 0, 0),
  egg: ingredient('egg_whole_hard_boiled', 'Egg, whole, hard-boiled', 'eggs', 155, 12.6, 1.12, 10.6, 0),
  spinach: ingredient('spinach_raw', 'Spinach, raw', 'vegetables', 21.6, 2.91, 2.64, 0.604, 1.59),
  pepper: ingredient('bell_pepper_red', 'Red bell pepper', 'vegetables', 27, 0.896, 6.65, 0.126, 1.16),
  cheddar: ingredient('cheese_cheddar', 'Cheddar cheese', 'dairy', 408, 23.3, 2.44, 34, 0),
  whey: ingredient('whey_protein_powder', 'Whey protein powder', 'supplements', 352, 78.1, 6.25, 1.56, 3.1),
  banana: ingredient('banana', 'Banana', 'fruit', 97, 0.74, 23, 0.29, 1.7),
  greekYogurt: ingredient('greek_yogurt_plain_nonfat', 'Greek yogurt, plain, nonfat', 'dairy', 61, 10.3, 3.64, 0.37, 0),
  bread: ingredient('bread_whole_wheat', 'Whole wheat bread', 'grains', 261, 12.9, 44.5, 3.5, 5.9),
  peanutButter: ingredient('peanut_butter', 'Peanut butter', 'fats', 589, 24, 22.7, 49.4, 6.32),
  avocado: ingredient('avocado', 'Avocado', 'vegetables', 160, 2, 8.53, 14.7, 6.7),
  tomato: ingredient('tomato_raw', 'Tomato, raw', 'vegetables', 18, 0.88, 3.89, 0.2, 1.2),
  tofu: ingredient('tofu_firm', 'Tofu, firm', 'plant_protein', 144, 17.3, 2.78, 8.72, 2.3),
  onion: ingredient('onion_raw', 'Onion, raw', 'vegetables', 38, 0.83, 8.61, 0.05, 1.9),
  oliveOil: ingredient('olive_oil', 'Olive oil', 'fats', 884, 0, 0, 100, 0),
  chicken: ingredient('chicken_breast_roasted', 'Chicken breast, roasted', 'meat', 165, 31, 0, 3.57, 0),
  rice: ingredient('rice_white_cooked', 'White rice, long-grain, cooked', 'grains', 130, 2.69, 28.2, 0.28, 0.4),
  broccoli: ingredient('broccoli_boiled', 'Broccoli, boiled', 'vegetables', 35, 2.38, 7.18, 0.41, 3.3),
  beef: ingredient('beef_ground_90_cooked', 'Ground beef 90/10, cooked', 'meat', 230, 28.4, 0, 12, 0),
  quinoa: ingredient('quinoa_cooked', 'Quinoa, cooked', 'grains', 120, 4.4, 21.3, 1.92, 2.8),
  salmon: ingredient('salmon_farmed_baked', 'Salmon, farmed, baked', 'seafood', 206, 22.1, 0, 12.4, 0),
  sweetPotato: ingredient('sweet_potato_baked', 'Sweet potato, baked', 'grains', 90, 2.01, 20.7, 0.15, 3.3),
  brownRice: ingredient('rice_brown_cooked', 'Brown rice, long-grain, cooked', 'grains', 123, 2.74, 25.6, 0.97, 1.6),
  carrot: ingredient('carrot_raw', 'Carrot, raw', 'vegetables', 45, 0.941, 10.3, 0.351, 3.1),
  soySauce: ingredient('soy_sauce', 'Soy sauce', 'condiments', 53, 8.14, 4.93, 0.57, 0.8),
  turkey: ingredient('turkey_breast_roasted', 'Turkey breast, roasted', 'meat', 136, 29.5, 0, 1.97, 0),
  blackBeans: ingredient('black_beans_boiled', 'Black beans, boiled', 'legumes', 132, 8.86, 23.7, 0.54, 8.7),
  shrimp: ingredient('shrimp_boiled', 'Shrimp, boiled', 'seafood', 119, 22.8, 1.52, 1.7, 0),
  tortilla: ingredient('tortilla_flour', 'Flour tortilla', 'grains', 299, 7.88, 50.3, 7.39, 2.6),
  lettuce: ingredient('lettuce_romaine', 'Romaine lettuce', 'vegetables', 17, 1.24, 3.24, 0.26, 1.8),
  tuna: ingredient('tuna_light_canned_water', 'Tuna, light, canned in water', 'seafood', 90, 19, 0.08, 0.94, 0),
  chickpeas: ingredient('chickpeas_boiled', 'Chickpeas, boiled', 'legumes', 164, 8.86, 27.4, 2.59, 7.6),
  pasta: ingredient('pasta_dry', 'Pasta, dry', 'grains', 371, 15.1, 73.5, 1.85, 4.2),
  lentils: ingredient('lentils_boiled', 'Lentils, boiled', 'legumes', 116, 9.02, 20.1, 0.38, 7.9),
  sirloin: ingredient('beef_sirloin_broiled', 'Beef sirloin steak, broiled', 'meat', 257, 26.8, 0, 15.8, 0),
  butter: ingredient('butter', 'Butter', 'fats', 717, 0.85, 0.06, 81.1, 0),
  chickenThigh: ingredient('chicken_thigh_roasted', 'Chicken thigh, skinless, roasted', 'meat', 179, 24.8, 0, 8.15, 0),
  mozzarella: ingredient('cheese_mozzarella', 'Mozzarella cheese, low moisture', 'dairy', 298, 23.7, 4.44, 20.4, 0),
  cottageCheese: ingredient('cottage_cheese', 'Cottage cheese, 2% fat', 'dairy', 84, 11, 4.31, 2.3, 0),
  almonds: ingredient('almonds', 'Almonds', 'fats', 584, 21.5, 20, 51.1, 10.8),
  apple: ingredient('apple', 'Apple', 'fruit', 52, 0.26, 13.8, 0.17, 2.4),
  yogurt: ingredient('yogurt_plain_whole', 'Yogurt, plain, whole milk', 'dairy', 77.3, 3.82, 5.57, 4.48, 0),
}

/** `[ingredient, grams]` lines; each line gets its own copy so edits never leak between recipes. */
const r = (id: string, name: string, servings: number, lines: [FoodItem, number][]): MockRecipe =>
  ({ id, name, servings, ingredients: lines.map(([item, amount]) => ({ item: structuredClone(item), amount })) })

// Amounts are in grams. Pieces use the catalog's portion weight (1 egg 50 g, 1 banana 118 g, 1 slice 32 g…), ml is converted
// by density, and items the catalog doesn't have use the closest entry (granola → rolled oats, mixed greens → romaine).
export const RECIPES: MockRecipe[] = [
  // Breakfast
  r('overnight_oats', 'Overnight oats', 1, [[I.oats, 40], [I.milk, 124], [I.blueberries, 50], [I.honey, 7]]),
  r('veggie_omelette', 'Veggie egg-white omelette', 1, [[I.eggWhite, 132], [I.egg, 50], [I.spinach, 30], [I.pepper, 119], [I.cheddar, 15]]),
  r('protein_pancakes', 'Protein pancakes', 2, [[I.oats, 80], [I.whey, 60], [I.banana, 118], [I.egg, 100], [I.milk, 124]]),
  r('yogurt_parfait', 'Greek yogurt parfait', 1, [[I.greekYogurt, 170], [I.oats, 30], [I.blueberries, 75], [I.honey, 7]]),
  r('pb_banana_toast', 'PB banana toast', 1, [[I.bread, 64], [I.peanutButter, 16], [I.banana, 118]]),
  r('avocado_toast', 'Avocado toast with egg', 2, [[I.bread, 64], [I.avocado, 201], [I.egg, 100], [I.tomato, 123]]),
  r('protein_shake', 'Peanut butter banana shake', 1, [[I.whey, 30], [I.banana, 118], [I.milk, 247], [I.peanutButter, 16]]),
  r('tofu_scramble', 'Tofu scramble', 2, [[I.tofu, 300], [I.spinach, 60], [I.onion, 50], [I.pepper, 119], [I.oliveOil, 9]]),

  // Lunch & dinner
  r('my_bowl', 'My chicken & rice bowl', 1, [[I.chicken, 150], [I.rice, 150], [I.broccoli, 100], [I.oliveOil, 5]]),
  r('beef_quinoa_bowl', 'Beef & quinoa bowl', 2, [[I.beef, 250], [I.quinoa, 300], [I.pepper, 119], [I.onion, 100], [I.oliveOil, 9]]),
  r('salmon_sweet_potato', 'Salmon & sweet potato', 2, [[I.salmon, 300], [I.sweetPotato, 400], [I.broccoli, 200], [I.oliveOil, 9]]),
  r('tofu_stir_fry', 'Tofu stir-fry', 3, [[I.tofu, 400], [I.brownRice, 450], [I.broccoli, 200], [I.pepper, 238], [I.carrot, 150], [I.soySauce, 35]]),
  r('turkey_chili', 'Turkey chili', 6, [[I.turkey, 600], [I.blackBeans, 400], [I.tomato, 492], [I.onion, 200], [I.pepper, 238], [I.oliveOil, 14]]),
  r('shrimp_tacos', 'Shrimp tacos', 2, [[I.shrimp, 250], [I.tortilla, 196], [I.avocado, 201], [I.lettuce, 50], [I.tomato, 123]]),
  r('burrito_bowl', 'Chicken burrito bowl', 2, [[I.chicken, 300], [I.brownRice, 300], [I.blackBeans, 200], [I.avocado, 201], [I.tomato, 123]]),
  r('tuna_salad', 'Tuna chickpea salad', 1, [[I.tuna, 140], [I.lettuce, 100], [I.tomato, 123], [I.chickpeas, 80], [I.oliveOil, 9]]),
  r('spaghetti_bolognese', 'Spaghetti bolognese', 4, [[I.pasta, 280], [I.beef, 400], [I.tomato, 615], [I.onion, 150], [I.carrot, 100], [I.oliveOil, 14]]),
  r('lentil_soup', 'Lentil soup', 4, [[I.lentils, 600], [I.carrot, 200], [I.onion, 150], [I.spinach, 60], [I.oliveOil, 14]]),
  r('chickpea_salad', 'Mediterranean chickpea salad', 2, [[I.chickpeas, 300], [I.tomato, 246], [I.pepper, 119], [I.onion, 50], [I.oliveOil, 14]]),
  r('sirloin_sweet_potato', 'Sirloin & sweet potato', 2, [[I.sirloin, 300], [I.sweetPotato, 300], [I.lettuce, 100], [I.butter, 14]]),
  r('teriyaki_salmon', 'Teriyaki salmon rice bowl', 2, [[I.salmon, 250], [I.rice, 300], [I.broccoli, 150], [I.soySauce, 35], [I.honey, 21]]),
  r('chicken_quesadilla', 'Chicken quesadilla', 2, [[I.chicken, 200], [I.tortilla, 98], [I.cheddar, 60], [I.pepper, 119]]),
  r('thigh_traybake', 'Chicken thigh traybake', 4, [[I.chickenThigh, 600], [I.sweetPotato, 400], [I.carrot, 200], [I.onion, 150], [I.oliveOil, 27]]),
  r('egg_fried_rice', 'Egg fried rice', 2, [[I.rice, 300], [I.egg, 150], [I.carrot, 100], [I.soySauce, 35], [I.oliveOil, 9]]),
  r('tomato_mozzarella_pasta', 'Tomato mozzarella pasta', 3, [[I.pasta, 224], [I.tomato, 492], [I.mozzarella, 120], [I.oliveOil, 14]]),
  r('turkey_wrap', 'Turkey cheddar wrap', 1, [[I.turkey, 100], [I.tortilla, 49], [I.lettuce, 30], [I.cheddar, 15], [I.tomato, 123]]),
  r('quick_chicken_salad', 'Quick chicken salad', 1, [[I.chicken, 140], [I.lettuce, 100], [I.avocado, 100.5], [I.oliveOil, 9]]),

  // Snacks
  r('cottage_cheese_bowl', 'Cottage cheese berry bowl', 1, [[I.cottageCheese, 200], [I.blueberries, 75], [I.almonds, 14]]),
  r('apple_pb', 'Apple & peanut butter', 1, [[I.apple, 182], [I.peanutButter, 32]]),
  r('honey_almond_yogurt', 'Honey almond yogurt', 1, [[I.yogurt, 250], [I.almonds, 14], [I.honey, 7]]),
]
