<script setup lang="ts">
import type { Accent } from '~/types/ui'

// `addPct` previews what a pending log adds, as a lighter segment after the fill.
const props = defineProps<{ pct: number, accent: Accent, addPct?: number }>()
const a = computed(() => ACCENT[props.accent])
</script>

<template>
  <div class="h-[7px] rounded-full overflow-hidden flex" :class="a.track">
    <div class="h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none" :class="a.bar" :style="{ width: `${pct}%` }" />
    <div v-if="addPct" class="h-full rounded-r-full opacity-35" :class="a.bar" :style="{ width: `${addPct}%` }" />
  </div>
</template>
