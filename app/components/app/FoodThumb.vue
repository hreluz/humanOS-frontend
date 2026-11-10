<script setup lang="ts">
import type { FoodItem } from '~/types/food'

// A food's first photo as a 40 px button that opens its photo viewer. A food with no photos renders nothing, not an empty box.
const props = defineProps<{ food: FoodItem }>()
const { openPhotos } = useFoodPhotos()
const thumb = computed(() => props.food.photos[0]?.thumbnailUrl)
</script>

<template>
  <button
    v-if="thumb"
    type="button"
    :aria-label="`Photos of ${food.name}`"
    class="w-10 h-10 shrink-0 rounded-[10px] overflow-hidden bg-white"
    :class="focusRingCls"
    @click.stop="openPhotos(food)"
  >
    <img :src="thumb" alt="" loading="lazy" class="w-full h-full object-cover" draggable="false">
  </button>
</template>
