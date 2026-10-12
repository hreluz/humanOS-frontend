import { describe, expect, it } from 'vitest'
import { nextTick, ref } from 'vue'

const OPTIONS = ['a', 'b', 'c'] as const

/** A radiogroup element with one `role="radio"` button per option, attached to the document so it can take focus. */
function group() {
  const el = document.createElement('div')
  for (const o of OPTIONS) {
    const button = document.createElement('button')
    button.setAttribute('role', 'radio')
    button.textContent = o
    el.append(button)
  }
  document.body.append(el)
  return el
}

function press(onKeydown: (e: KeyboardEvent) => void, el: HTMLElement, key: string) {
  const e = new KeyboardEvent('keydown', { key, cancelable: true })
  Object.defineProperty(e, 'currentTarget', { value: el })
  onKeydown(e)
  return e
}

describe('useRadioGroup', () => {
  it('makes only the checked option tabbable, or the first when none is', () => {
    const model = ref<string>('b')
    const { tabindex } = useRadioGroup(OPTIONS, model)
    expect(OPTIONS.map(tabindex)).toEqual([-1, 0, -1])
    model.value = ''
    expect(OPTIONS.map(tabindex)).toEqual([0, -1, -1])
  })

  it('moves selection and focus with the arrow keys, wrapping at the ends', async () => {
    const model = ref<string>('c')
    const { onKeydown } = useRadioGroup(OPTIONS, model)
    const el = group()

    const e = press(onKeydown, el, 'ArrowRight')
    expect(model.value).toBe('a')
    expect(e.defaultPrevented).toBe(true)
    await nextTick()
    expect(document.activeElement).toBe(el.children[0])

    press(onKeydown, el, 'ArrowLeft')
    expect(model.value).toBe('c')
    press(onKeydown, el, 'ArrowUp')
    expect(model.value).toBe('b')
    press(onKeydown, el, 'ArrowDown')
    expect(model.value).toBe('c')
  })

  it('jumps with Home / End and starts from nothing selected', () => {
    const model = ref<string>('')
    const { onKeydown } = useRadioGroup(OPTIONS, model)
    const el = group()

    press(onKeydown, el, 'ArrowDown')
    expect(model.value).toBe('a')
    press(onKeydown, el, 'End')
    expect(model.value).toBe('c')
    press(onKeydown, el, 'Home')
    expect(model.value).toBe('a')
  })

  it('ignores other keys', () => {
    const model = ref<string>('a')
    const { onKeydown } = useRadioGroup(OPTIONS, model)
    const e = press(onKeydown, group(), 'Tab')
    expect(model.value).toBe('a')
    expect(e.defaultPrevented).toBe(false)
  })
})
