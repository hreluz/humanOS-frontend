<script setup lang="ts">
import type { Accent } from '~/types/ui'

const props = defineProps<{ pct: number, accent: Accent }>()
const a = computed(() => ACCENT[props.accent])
</script>

<template>
  <div class="h-[7px] rounded-full overflow-hidden" :class="a.track">
    <div class="h-full rounded-full" :class="a.bar" :style="{ width: `${pct}%` }" />
  </div>
</template>
