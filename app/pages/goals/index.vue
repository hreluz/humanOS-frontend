<script setup lang="ts">
definePageMeta({ tab: 'goals' })

const { goals } = useGoals()
</script>

<template>
  <div class="max-w-[760px] flex flex-col gap-3">
    <div v-for="g in goals ?? []" :key="g.id" class="rounded-2xl px-5 py-[18px] shadow-xs" :class="cardCls">
      <div class="flex justify-between mb-2.5">
        <span class="text-[15.5px] font-bold" :class="inkCls">{{ g.label }}</span>
        <span class="text-[13.5px]" :class="inkFaintCls">{{ g.sub }}</span>
      </div>
      <AppProgressBar :pct="g.pct" :accent="g.accent" />
    </div>
    <NuxtLink to="/goals/new" class="self-start px-5 py-2.5 rounded-full bg-[#0B0B0C] text-white text-[14px] font-semibold mt-1.5">+ New goal</NuxtLink>
  </div>
</template>
