import type { ModalKey } from '~/types/ui'

export function useModal() {
  const current = useState<ModalKey | null>('modal', () => null)
  const open = (key: ModalKey) => { current.value = key }
  const close = () => { current.value = null }
  const isOpen = computed(() => current.value !== null)
  return { current, isOpen, open, close }
}
