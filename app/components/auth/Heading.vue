<script setup lang="ts">
defineProps<{ title: string, subtitle?: string }>()
</script>

<template>
  <div class="mb-1">
    <slot name="eyebrow" />
    <h1 class="text-[22px] font-bold tracking-tight" :class="[inkCls, $slots.eyebrow ? 'mt-1' : '']">{{ title }}</h1>
    <p v-if="subtitle" class="text-[14px] mt-1" :class="inkSoftCls">{{ subtitle }}</p>
  </div>
</template>
