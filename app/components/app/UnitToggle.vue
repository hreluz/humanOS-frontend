<script setup lang="ts">
import type { UnitSystem } from '~/types/profile'

const OPTIONS: { value: UnitSystem, label: string }[] = [{ value: 'metric', label: 'Metric' }, { value: 'imperial', label: 'Imperial' }]

const model = defineModel<UnitSystem>({ required: true })
const { tabindex, onKeydown } = useRadioGroup(OPTIONS.map(o => o.value), model)
</script>

<template>
  <div class="flex items-center justify-between gap-3">
    <span class="text-[12.5px] font-semibold" :class="inkSoftCls">Units</span>
    <div class="flex rounded-[10px] p-[3px] bg-canvas dark:bg-white/[0.06]" role="radiogroup" aria-label="Units" @keydown="onKeydown">
      <button
        v-for="o in OPTIONS"
        :key="o.value"
        type="button"
        role="radio"
        :aria-checked="model === o.value"
        :tabindex="tabindex(o.value)"
        class="px-3.5"
        :class="[segmentCls, focusRingCls, model === o.value ? segmentOnCls : inkSoftCls]"
        @click="model = o.value"
      >
        {{ o.label }}
      </button>
    </div>
  </div>
</template>
