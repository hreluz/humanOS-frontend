<script setup lang="ts">
import type { ThemePreference } from '~/types/ui'

const OPTIONS: ThemePreference[] = ['system', 'light', 'dark']
const { preference, setPreference } = useTheme()
</script>

<template>
  <div class="flex rounded-[10px] p-[3px] shrink-0" :class="bgCls" role="radiogroup" aria-label="Theme">
    <button
      v-for="key in OPTIONS"
      :key="key"
      type="button"
      role="radio"
      :aria-checked="preference === key"
      class="px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-[12.5px] font-semibold"
      :class="preference === key ? 'bg-ink text-white dark:bg-white dark:text-black' : inkSoftCls"
      @click="setPreference(key)"
    >
      {{ key[0]!.toUpperCase() + key.slice(1) }}
    </button>
  </div>
</template>
