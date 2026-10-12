<script setup lang="ts">
import type { ActivityLevel } from '~/types/profile'

defineProps<{ error?: string }>()
const model = defineModel<ActivityLevel>({ required: true })
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <span class="text-[12.5px] font-semibold" :class="inkSoftCls">Activity level</span>
    <div class="grid grid-cols-2 sm:grid-cols-5 gap-1 bg-canvas dark:bg-white/[0.06] rounded-xl p-1" role="radiogroup" aria-label="Activity level">
      <button
        v-for="a in ACTIVITY_LEVELS"
        :key="a.value"
        type="button"
        role="radio"
        :aria-checked="model === a.value"
        class="text-center py-2 rounded-lg text-[12.5px] font-semibold"
        :class="model === a.value ? 'bg-ink text-white dark:bg-white dark:text-black' : inkSoftCls"
        @click="model = a.value"
      >
        {{ a.label }}
      </button>
    </div>
    <span v-if="error" class="text-[12px] text-accent-coral">{{ error }}</span>
  </div>
</template>
