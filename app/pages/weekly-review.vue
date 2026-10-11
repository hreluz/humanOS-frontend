<script setup lang="ts">
definePageMeta({ tab: 'weeklyReview' })

const { review } = useWeeklyReview()
const tiles = computed(() => review.value
  ? [[review.value.avgCalories, 'Avg calories'], [review.value.proteinHit, 'Protein hit'], [review.value.workouts, 'Workouts'], [review.value.avgSleep, 'Avg sleep']]
  : [])
</script>

<template>
  <div v-if="review" class="max-w-[760px]">
    <div class="text-[14px] mb-[18px]" :class="inkFaintCls">{{ review.range }}</div>
    <div class="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-4 md:gap-5 mb-4">
      <div class="rounded-2xl p-5 shadow-xs" :class="cardCls">
        <div class="flex justify-between items-baseline mb-3">
          <span class="text-[14px]" :class="inkSoftCls">Weight trend</span>
          <span class="text-[15px] font-bold text-accent-green dark:text-accent-green-dark">{{ review.weightDelta }}</span>
        </div>
        <svg width="100%" height="64" viewBox="0 0 320 56" preserveAspectRatio="none" role="img" aria-label="Weight trend this week">
          <polyline :points="review.trendPoints" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" :class="linkBlueCls" />
        </svg>
      </div>
      <div class="bg-ink rounded-2xl p-5">
        <div class="text-[14.5px] font-semibold text-white mb-2">Coach's recommendation</div>
        <div class="text-[13.5px] text-white/70 leading-relaxed">{{ review.recommendation }}</div>
      </div>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div v-for="[val, label] in tiles" :key="label" class="rounded-2xl p-4 shadow-xs" :class="cardCls">
        <div class="text-[19px] font-bold" :class="inkCls">{{ val }}</div>
        <div class="text-xs" :class="inkFaintCls">{{ label }}</div>
      </div>
    </div>
  </div>
</template>
