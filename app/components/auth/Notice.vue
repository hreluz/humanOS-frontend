<script setup lang="ts">
defineProps<{ tone: 'error' | 'success' }>()
</script>

<template>
  <p
    :role="tone === 'error' ? 'alert' : 'status'"
    class="rounded-xl px-3.5 py-2.5 text-[13.5px] font-medium"
    :class="tone === 'error'
      ? 'bg-[#FF6B4A]/10 text-[#E5532F] dark:text-[#FF7A5C]'
      : 'bg-[#E5F6EC] text-[#1F8A45] dark:bg-[#32D74B]/15 dark:text-[#32D74B]'"
  >
    <slot />
  </p>
</template>
