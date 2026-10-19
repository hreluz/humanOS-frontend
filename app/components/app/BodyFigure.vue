<script setup lang="ts">
import type { BodyView, MuscleKey } from '~/types/training'

const props = defineProps<{ view: BodyView, selected: MuscleKey | null }>()
const emit = defineEmits<{ select: [muscle: MuscleKey] }>()

// Each shape is the left half; the mirror copy draws the right side.
const MIRROR = 'translate(200,0) scale(-1,1)'
const regions = computed(() => BODY_REGIONS[props.view])
</script>

<template>
  <svg :viewBox="BODY_VIEWBOX" class="w-full h-auto" role="group" :aria-label="`Body, ${view} view`">
    <g class="fill-black/[0.06] dark:fill-white/[0.08]" aria-hidden="true">
      <template v-for="d in BODY_SILHOUETTE" :key="d">
        <path :d="d" />
        <path :d="d" :transform="MIRROR" />
      </template>
    </g>
    <g
      v-for="r in regions"
      :key="r.muscle"
      role="button"
      tabindex="0"
      class="group cursor-pointer outline-none"
      :aria-label="MUSCLE_LABELS[r.muscle]"
      :aria-pressed="selected === r.muscle"
      :data-muscle="r.muscle"
      @click="emit('select', r.muscle)"
      @keydown.enter.prevent="emit('select', r.muscle)"
      @keydown.space.prevent="emit('select', r.muscle)"
    >
      <path
        v-for="t in [undefined, MIRROR]"
        :key="t ?? 'left'"
        :d="r.d"
        :transform="t"
        stroke-width="1.5"
        stroke-linejoin="round"
        class="stroke-white dark:stroke-surface-dark transition-colors motion-reduce:transition-none group-focus-visible:stroke-ink dark:group-focus-visible:stroke-white"
        :class="selected === r.muscle
          ? 'fill-accent-coral dark:fill-accent-coral-dark'
          : 'fill-black/[0.16] dark:fill-white/[0.2] group-hover:fill-accent-coral/45 dark:group-hover:fill-accent-coral-dark/50'"
      />
    </g>
  </svg>
</template>
