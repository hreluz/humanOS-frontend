<script setup lang="ts">
import type { FoodItem } from '~/types/food'

// Grams or one of the ingredient's portions, in API order. Hidden for recipes and ingredients without portions.
const props = defineProps<{ item: FoodItem, portion?: string }>()
const emit = defineEmits<{ change: [portion: string | null] }>()

function onChange(e: Event) {
  emit('change', (e.target as HTMLSelectElement).value || null)
}
</script>

<template>
  <select
    v-if="hasUnitPicker(props.item)"
    :value="portion ?? ''"
    :aria-label="`Unit for ${item.name}`"
    class="h-9 max-w-[150px] shrink min-w-0 rounded-full pl-3 pr-2 text-[13px] font-semibold truncate dark:[color-scheme:dark]"
    :class="[bgCls, inkCls, focusRingCls]"
    @change="onChange"
  >
    <option value="">g</option>
    <option v-for="p in item.portions" :key="p.key" :value="p.key">{{ p.label }}</option>
  </select>
</template>
