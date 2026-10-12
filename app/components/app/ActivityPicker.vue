<script setup lang="ts">
import type { ActivityLevel } from '~/types/profile'

defineProps<{ error?: string }>()
const model = defineModel<ActivityLevel>({ required: true })
const { tabindex, onKeydown } = useRadioGroup(ACTIVITY_LEVELS.map(a => a.value), model)
const id = useId()
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <span :id="`${id}-label`" class="text-[12.5px] font-semibold" :class="inkSoftCls">Activity level</span>
    <!-- One row per level so labels never wrap, with a hint to help pick the right one. -->
    <div
      class="flex flex-col gap-1.5"
      role="radiogroup"
      :aria-labelledby="`${id}-label`"
      :aria-invalid="!!error"
      :aria-describedby="error ? `${id}-error` : undefined"
      @keydown="onKeydown"
    >
      <button
        v-for="a in ACTIVITY_LEVELS"
        :key="a.value"
        type="button"
        role="radio"
        :aria-checked="model === a.value"
        :tabindex="tabindex(a.value)"
        class="min-h-11 rounded-xl px-3.5 py-2 border-2 flex items-center gap-3 text-left"
        :class="[focusRingCls, model === a.value ? 'border-ink dark:border-white' : 'border-black/[0.06] dark:border-white/10 hover:border-black/20 dark:hover:border-white/25']"
        @click="model = a.value"
      >
        <span class="flex-1 min-w-0">
          <span class="block text-[14px] font-semibold" :class="inkCls">{{ a.label }}</span>
          <span class="block text-[12.5px]" :class="inkSoftCls">{{ a.hint }}</span>
        </span>
        <AppIcon v-if="model === a.value" :path="ICONS.check" class="w-4 h-4 shrink-0" :class="inkCls" />
      </button>
    </div>
    <span v-if="error" :id="`${id}-error`" class="text-[12px] text-accent-coral">{{ error }}</span>
  </div>
</template>
