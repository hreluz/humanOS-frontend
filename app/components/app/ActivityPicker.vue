<script setup lang="ts">
import type { ActivityLevel } from '~/types/auth'

const model = defineModel<ActivityLevel>({ required: true })
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <span class="text-[12.5px] font-semibold" :class="inkSoftCls">Activity level</span>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-1 bg-canvas dark:bg-white/[0.06] rounded-xl p-1" role="radiogroup" aria-label="Activity level">
      <button
        v-for="a in ACTIVITY_LEVELS"
        :key="a"
        type="button"
        role="radio"
        :aria-checked="model === a"
        class="text-center py-2 rounded-lg text-[12.5px] font-semibold"
        :class="model === a ? 'bg-ink text-white dark:bg-white dark:text-black' : inkSoftCls"
        @click="model = a"
      >
        {{ a }}
      </button>
    </div>
  </div>
</template>
