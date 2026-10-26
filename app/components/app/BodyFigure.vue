<script setup lang="ts">
import type { BodyView, MuscleKey } from '~/types/training'

/** `labels` comes from the muscle catalog API: a muscle without a label (catalog not loaded yet) is drawn as plain silhouette. */
const props = defineProps<{ view: BodyView, selected: MuscleKey | null, labels: Partial<Record<MuscleKey, string>> }>()
const emit = defineEmits<{ select: [muscle: MuscleKey] }>()

const regions = computed(() => BODY_REGIONS[props.view])
const tappable = computed(() => regions.value.muscles.filter(r => props.labels[r.muscle]))
const neutral = computed(() => [
  ...regions.value.neutral,
  ...regions.value.muscles.filter(r => !props.labels[r.muscle]).flatMap(r => r.paths),
])
</script>

<template>
  <svg :viewBox="BODY_VIEWBOX[view]" class="w-full h-auto" role="group" :aria-label="`Body, ${view} view`">
    <g class="fill-black/[0.1] dark:fill-white/[0.12]" aria-hidden="true">
      <path v-for="d in neutral" :key="d" :d="d" />
    </g>
    <g
      v-for="r in tappable"
      :key="r.muscle"
      role="button"
      tabindex="0"
      class="group cursor-pointer outline-none"
      :aria-label="labels[r.muscle]"
      :aria-pressed="selected === r.muscle"
      :data-muscle="r.muscle"
      @click="emit('select', r.muscle)"
      @keydown.enter.prevent="emit('select', r.muscle)"
      @keydown.space.prevent="emit('select', r.muscle)"
    >
      <path
        v-for="d in r.paths"
        :key="d"
        :d="d"
        stroke-width="0.12"
        stroke-linejoin="round"
        class="stroke-white dark:stroke-surface-dark transition-colors motion-reduce:transition-none group-focus-visible:stroke-ink dark:group-focus-visible:stroke-white group-focus-visible:[stroke-width:0.35]"
        :class="selected === r.muscle
          ? 'fill-accent-coral dark:fill-accent-coral-dark'
          : 'fill-black/[0.22] dark:fill-white/[0.26] group-hover:fill-accent-coral/45 dark:group-hover:fill-accent-coral-dark/50'"
      />
    </g>
  </svg>
</template>
