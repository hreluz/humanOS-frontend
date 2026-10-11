<script setup lang="ts">
definePageMeta({ tab: 'stats' })

const { period, stats } = useStats()
const TILES = [['steps', 'Steps'], ['activeKcal', 'Active kcal'], ['restingHr', 'Resting HR'], ['sleep', 'Sleep'], ['weight', 'Weight'], ['vo2', 'VO₂ max']] as const
const linkCls = ['px-4 py-2.5 rounded-[10px] text-[13.5px] font-semibold shadow-xs', cardCls, inkCls]
</script>

<template>
  <div class="max-w-[1000px]">
    <div class="flex justify-between items-center mb-[18px]">
      <div class="flex rounded-[10px] p-[3px] shadow-xs" :class="cardCls" role="radiogroup" aria-label="Period">
        <button
          v-for="p in STATS_PERIODS"
          :key="p"
          type="button"
          role="radio"
          :aria-checked="period === p"
          class="px-3.5 py-1.5 rounded-lg text-[13px]"
          :class="period === p ? [bgCls, 'font-semibold', inkCls] : ['font-normal', inkSoftCls]"
          @click="period = p"
        >
          {{ p }}
        </button>
      </div>
      <div class="flex gap-2.5">
        <NuxtLink to="/weekly-review" :class="linkCls">Weekly review</NuxtLink>
        <NuxtLink to="/goals" :class="linkCls">Goals</NuxtLink>
      </div>
    </div>
    <div v-if="stats" class="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
      <div v-for="[key, label] in TILES" :key="key" class="rounded-2xl p-5 shadow-xs" :class="cardCls">
        <div class="text-2xl font-bold" :class="inkCls">{{ stats[key] }}</div>
        <div class="text-[13px] mt-0.5" :class="inkFaintCls">{{ label }}</div>
      </div>
    </div>
  </div>
</template>
