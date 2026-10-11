import type { GroceryList } from '~/types/grocery'
import { delay } from './mocks/delay'
import { INITIAL_GROCERY } from './mocks/grocery'

const grocery: GroceryList = structuredClone(INITIAL_GROCERY)

export async function getGroceryList(): Promise<GroceryList> {
  await delay()
  return structuredClone(grocery)
}

export async function toggleGroceryItem(id: string): Promise<GroceryList> {
  await delay()
  grocery.checked[id] = !grocery.checked[id]
  return structuredClone(grocery)
}
