<script setup lang="ts">
import type { UnitSystem } from '~/types/profile'

const OPTIONS: { value: UnitSystem, label: string }[] = [{ value: 'metric', label: 'Metric' }, { value: 'imperial', label: 'Imperial' }]

const model = defineModel<UnitSystem>({ required: true })
</script>

<template>
  <div class="flex items-center justify-between gap-3">
    <span class="text-[12.5px] font-semibold" :class="inkSoftCls">Units</span>
    <div class="flex rounded-[10px] p-[3px] bg-canvas dark:bg-white/[0.06]" role="radiogroup" aria-label="Units">
      <button
        v-for="o in OPTIONS"
        :key="o.value"
        type="button"
        role="radio"
        :aria-checked="model === o.value"
        class="px-3 py-1.5 rounded-lg text-[12.5px] font-semibold"
        :class="model === o.value ? 'bg-ink text-white dark:bg-white dark:text-black' : inkSoftCls"
        @click="model = o.value"
      >
        {{ o.label }}
      </button>
    </div>
  </div>
</template>
