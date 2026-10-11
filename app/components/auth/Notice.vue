<script setup lang="ts">
defineProps<{ tone: 'error' | 'success' }>()
</script>

<template>
  <p
    :role="tone === 'error' ? 'alert' : 'status'"
    class="rounded-xl px-3.5 py-2.5 text-[13.5px] font-medium"
    :class="tone === 'error'
      ? 'bg-accent-coral/10 text-accent-coral-strong dark:text-accent-coral-dark'
      : 'bg-accent-green-tint text-accent-green-strong dark:bg-accent-green-dark/15 dark:text-accent-green-dark'"
  >
    <slot />
  </p>
</template>
