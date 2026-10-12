<script setup lang="ts">
import type { Sex } from '~/types/profile'

const OPTIONS: { value: Sex, label: string }[] = [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]

defineProps<{ error?: string }>()
const model = defineModel<Sex | ''>({ required: true })
const { tabindex, onKeydown } = useRadioGroup<Sex | ''>(OPTIONS.map(o => o.value), model)
const id = useId()
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <span :id="`${id}-label`" class="text-[12.5px] font-semibold" :class="inkSoftCls">Sex</span>
    <div
      class="grid grid-cols-2 gap-1 bg-canvas dark:bg-white/[0.06] rounded-xl p-1"
      :class="error ? 'ring-1 ring-accent-coral' : ''"
      role="radiogroup"
      :aria-labelledby="`${id}-label`"
      :aria-invalid="!!error"
      :aria-describedby="error ? `${id}-error` : undefined"
      @keydown="onKeydown"
    >
      <button
        v-for="o in OPTIONS"
        :key="o.value"
        type="button"
        role="radio"
        :aria-checked="model === o.value"
        :tabindex="tabindex(o.value)"
        class="text-center"
        :class="[segmentCls, focusRingCls, model === o.value ? segmentOnCls : inkSoftCls]"
        @click="model = o.value"
      >
        {{ o.label }}
      </button>
    </div>
    <span v-if="error" :id="`${id}-error`" class="text-[12px] text-accent-coral">{{ error }}</span>
  </div>
</template>
