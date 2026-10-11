<script setup lang="ts">
import type { GoalKey } from '~/types/auth'

const model = defineModel<GoalKey>({ required: true })
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5" role="radiogroup" aria-label="Main goal">
    <button
      v-for="g in ONBOARD_GOALS"
      :key="g.key"
      type="button"
      role="radio"
      :aria-checked="model === g.key"
      class="rounded-xl p-3.5 border-2 flex sm:flex-col gap-3 sm:gap-2 items-center sm:items-start text-left"
      :class="model === g.key ? 'border-ink dark:border-white' : 'border-black/[0.06] dark:border-white/10 hover:border-black/20 dark:hover:border-white/25'"
      @click="model = g.key"
    >
      <AppIcon :path="g.icon" class="w-5 h-5 shrink-0" :class="inkCls" />
      <div>
        <div class="text-[14px] font-semibold" :class="inkCls">{{ g.label }}</div>
        <div class="text-[12px]" :class="inkSoftCls">{{ g.hint }}</div>
      </div>
    </button>
  </div>
</template>
