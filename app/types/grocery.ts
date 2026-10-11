export interface GroceryItem {
  id: string
  name: string
  price: string
}

export interface GroceryGroup {
  cat: string
  items: GroceryItem[]
}

export interface GroceryList {
  groups: GroceryGroup[]
  checked: Record<string, boolean>
}
