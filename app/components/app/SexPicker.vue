<script setup lang="ts">
import type { Sex } from '~/types/profile'

const OPTIONS: { value: Sex, label: string }[] = [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]

defineProps<{ error?: string }>()
const model = defineModel<Sex | ''>({ required: true })
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <span class="text-[12.5px] font-semibold" :class="inkSoftCls">Sex</span>
    <div class="grid grid-cols-2 gap-1 bg-canvas dark:bg-white/[0.06] rounded-xl p-1" role="radiogroup" aria-label="Sex">
      <button
        v-for="o in OPTIONS"
        :key="o.value"
        type="button"
        role="radio"
        :aria-checked="model === o.value"
        class="text-center py-2 rounded-lg text-[12.5px] font-semibold"
        :class="model === o.value ? 'bg-ink text-white dark:bg-white dark:text-black' : inkSoftCls"
        @click="model = o.value"
      >
        {{ o.label }}
      </button>
    </div>
    <span v-if="error" class="text-[12px] text-accent-coral">{{ error }}</span>
  </div>
</template>
