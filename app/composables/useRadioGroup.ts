import type { MaybeRefOrGetter, Ref } from 'vue'

/**
 * Keyboard behaviour for a custom `role="radiogroup"`: one tab stop (the checked option, else the first),
 * and arrow keys / Home / End move both the selection and focus. Bind `onKeydown` on the radiogroup element
 * and `tabindex(value)` on each `role="radio"` button, rendered in `options` order.
 */
export function useRadioGroup<T>(options: MaybeRefOrGetter<readonly T[]>, model: Ref<T>) {
  function tabindex(value: T) {
    const list = toValue(options)
    const active = list.includes(model.value) ? model.value : list[0]
    return value === active ? 0 : -1
  }

  function onKeydown(e: KeyboardEvent) {
    const list = toValue(options)
    const last = list.length - 1
    const i = list.indexOf(model.value)
    let next: number
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = i >= last ? 0 : i + 1
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        next = i <= 0 ? last : i - 1
        break
      case 'Home':
        next = 0
        break
      case 'End':
        next = last
        break
      default:
        return
    }
    e.preventDefault()
    model.value = list[next]!
    const group = e.currentTarget as HTMLElement | null
    nextTick(() => group?.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus())
  }

  return { tabindex, onKeydown }
}
