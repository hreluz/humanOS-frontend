<script setup lang="ts">
defineProps<{ disabled?: boolean }>()
</script>

<template>
  <button
    type="submit"
    :disabled="disabled"
    class="h-11 w-full rounded-full bg-ink dark:bg-white text-white dark:text-black text-[14.5px] font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity"
  >
    <slot />
  </button>
</template>
