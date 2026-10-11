import * as groceryService from '~/services/groceryService'

export function useGrocery() {
  const { state: list, pending } = useServiceState('grocery', groceryService.getGroceryList)

  const items = computed(() => list.value?.groups.flatMap(g => g.items) ?? [])
  const total = computed(() => items.value.reduce((a, i) => a + parseFloat(i.price), 0).toFixed(2))

  async function toggle(id: string) {
    if (!list.value) return
    // Optimistic: flip immediately, then take the service's copy.
    list.value.checked[id] = !list.value.checked[id]
    list.value = await groceryService.toggleGroceryItem(id)
  }

  return { list, pending, itemCount: computed(() => items.value.length), total, toggle }
}
