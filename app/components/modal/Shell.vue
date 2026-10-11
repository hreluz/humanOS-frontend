<script setup lang="ts">
// Overlay + panel: bottom sheet on mobile, centered card on md+.
withDefaults(defineProps<{ panelClass?: string, label: string }>(), {
  panelClass: 'md:w-[520px] max-h-[85vh] md:max-h-[640px]',
})
const { close } = useModal()

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-20" @click.self="close">
    <div
      role="dialog"
      aria-modal="true"
      :aria-label="label"
      class="w-full rounded-t-3xl md:rounded-2xl flex flex-col overflow-hidden shadow-2xl"
      :class="[cardCls, panelClass]"
    >
      <slot />
    </div>
  </div>
</template>
