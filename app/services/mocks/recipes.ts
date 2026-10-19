/** A saved recipe as the API returns it: ingredients reference `INGREDIENTS` ids, amounts are in each ingredient's unit. */
export interface MockRecipe {
  id: string
  name: string
  servings: number
  ingredients: { ingredientId: string, amount: number }[]
}

const r = (id: string, name: string, servings: number, ingredients: [string, number][]): MockRecipe =>
  ({ id, name, servings, ingredients: ingredients.map(([ingredientId, amount]) => ({ ingredientId, amount })) })

export const RECIPES: MockRecipe[] = [
  // Breakfast
  r('overnight_oats', 'Overnight oats', 1, [['oats', 40], ['milk_whole', 120], ['blueberries', 50], ['honey', 7]]),
  r('veggie_omelette', 'Veggie egg-white omelette', 1, [['egg_white', 4], ['egg_boiled', 1], ['spinach', 30], ['bell_pepper', 1], ['cheddar', 15]]),
  r('protein_pancakes', 'Protein pancakes', 2, [['oats', 80], ['whey', 2], ['banana', 1], ['egg_boiled', 2], ['milk_whole', 120]]),
  r('yogurt_parfait', 'Greek yogurt parfait', 1, [['fage_yogurt', 1], ['granola', 30], ['blueberries', 75], ['honey', 7]]),
  r('pb_banana_toast', 'PB banana toast', 1, [['dkb_bread', 2], ['peanut_butter', 16], ['banana', 1]]),
  r('avocado_toast', 'Avocado toast with egg', 2, [['dkb_bread', 2], ['avocado', 1], ['egg_boiled', 2], ['tomato', 1]]),
  r('protein_shake', 'Peanut butter banana shake', 1, [['whey', 1], ['banana', 1], ['milk_whole', 240], ['peanut_butter', 16]]),
  r('tofu_scramble', 'Tofu scramble', 2, [['tofu', 300], ['spinach', 60], ['onion', 50], ['bell_pepper', 1], ['olive_oil', 10]]),

  // Lunch & dinner
  r('my_bowl', 'My chicken & rice bowl', 1, [['chicken_grilled', 150], ['rice_cooked', 150], ['broccoli', 100], ['olive_oil', 5]]),
  r('beef_quinoa_bowl', 'Beef & quinoa bowl', 2, [['beef_ground', 250], ['quinoa', 300], ['bell_pepper', 1], ['onion', 100], ['olive_oil', 10]]),
  r('salmon_sweet_potato', 'Salmon & sweet potato', 2, [['salmon_baked', 300], ['sweet_potato', 400], ['broccoli', 200], ['olive_oil', 10]]),
  r('tofu_stir_fry', 'Tofu stir-fry', 3, [['tofu', 400], ['brown_rice', 450], ['broccoli', 200], ['bell_pepper', 2], ['carrot', 150], ['soy_sauce', 30]]),
  r('turkey_chili', 'Turkey chili', 6, [['turkey_breast', 600], ['black_beans', 400], ['tomato', 4], ['onion', 200], ['bell_pepper', 2], ['olive_oil', 15]]),
  r('shrimp_tacos', 'Shrimp tacos', 2, [['shrimp', 250], ['tortilla', 4], ['avocado', 1], ['greens', 50], ['tomato', 1]]),
  r('burrito_bowl', 'Chicken burrito bowl', 2, [['chicken_grilled', 300], ['brown_rice', 300], ['black_beans', 200], ['avocado', 1], ['tomato', 1]]),
  r('tuna_salad', 'Tuna chickpea salad', 1, [['tuna_canned', 140], ['greens', 100], ['tomato', 1], ['chickpeas', 80], ['olive_oil', 10]]),
  r('spaghetti_bolognese', 'Spaghetti bolognese', 4, [['barilla_spaghetti', 280], ['beef_ground', 400], ['tomato', 5], ['onion', 150], ['carrot', 100], ['olive_oil', 15]]),
  r('lentil_soup', 'Lentil soup', 4, [['lentils', 600], ['carrot', 200], ['onion', 150], ['spinach', 60], ['olive_oil', 15]]),
  r('chickpea_salad', 'Mediterranean chickpea salad', 2, [['chickpeas', 300], ['tomato', 2], ['bell_pepper', 1], ['onion', 50], ['olive_oil', 15]]),
  r('sirloin_sweet_potato', 'Sirloin & sweet potato', 2, [['sirloin', 300], ['sweet_potato', 300], ['greens', 100], ['butter', 14]]),
  r('teriyaki_salmon', 'Teriyaki salmon rice bowl', 2, [['salmon_baked', 250], ['rice_cooked', 300], ['broccoli', 150], ['soy_sauce', 30], ['honey', 21]]),
  r('chicken_quesadilla', 'Chicken quesadilla', 2, [['chicken_grilled', 200], ['tortilla', 2], ['cheddar', 60], ['bell_pepper', 1]]),
  r('thigh_traybake', 'Chicken thigh traybake', 4, [['chicken_thigh', 600], ['sweet_potato', 400], ['carrot', 200], ['onion', 150], ['olive_oil', 30]]),
  r('egg_fried_rice', 'Egg fried rice', 2, [['rice_cooked', 300], ['egg_boiled', 3], ['carrot', 100], ['soy_sauce', 30], ['olive_oil', 10]]),
  r('tomato_mozzarella_pasta', 'Tomato mozzarella pasta', 3, [['barilla_spaghetti', 224], ['tomato', 4], ['mozzarella', 120], ['olive_oil', 15]]),
  r('turkey_wrap', 'Turkey cheddar wrap', 1, [['turkey_breast', 100], ['tortilla', 1], ['greens', 30], ['cheddar', 15], ['tomato', 1]]),
  r('quick_chicken_salad', 'Quick chicken salad', 1, [['tj_chicken', 1], ['greens', 100], ['avocado', 0.5], ['olive_oil', 10]]),

  // Snacks
  r('cottage_cheese_bowl', 'Cottage cheese berry bowl', 1, [['cottage_cheese', 200], ['blueberries', 75], ['almonds', 14]]),
  r('apple_pb', 'Apple & peanut butter', 1, [['apple', 1], ['peanut_butter', 32]]),
  r('honey_almond_yogurt', 'Honey almond yogurt', 1, [['yogurt_plain', 250], ['almonds', 14], ['honey', 7]]),
]
