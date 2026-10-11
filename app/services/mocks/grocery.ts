import type { GroceryList } from '~/types/grocery'

export const INITIAL_GROCERY: GroceryList = {
  groups: [
    { cat: 'Protein', items: [
      { id: 'chicken', name: 'Chicken breast, 1kg', price: '7.20' },
      { id: 'salmon', name: 'Salmon fillets, 600g', price: '11.40' },
      { id: 'yogurt', name: 'Greek yogurt, 1kg tub', price: '5.80' },
    ] },
    { cat: 'Produce', items: [
      { id: 'broccoli', name: 'Broccoli, 2 heads', price: '3.10' },
      { id: 'blueberries', name: 'Blueberries, 2 punnets', price: '6.50' },
      { id: 'greens', name: 'Mixed greens, 1 bag', price: '2.90' },
    ] },
    { cat: 'Pantry', items: [
      { id: 'rice', name: 'Jasmine rice, 2kg', price: '4.20' },
      { id: 'oil', name: 'Olive oil, 500ml', price: '8.50' },
    ] },
  ],
  checked: { chicken: true },
}
