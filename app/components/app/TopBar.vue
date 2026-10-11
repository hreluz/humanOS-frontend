<script setup lang="ts">
defineProps<{ title: string }>()
</script>

<template>
  <header class="h-14 md:h-16 shrink-0 flex items-center justify-between px-4 sm:px-6 md:px-8 border-b" :class="dividerCls">
    <div class="flex items-center gap-2.5 min-w-0">
      <div class="md:hidden w-7 h-7 rounded-[8px] bg-ink flex items-center justify-center shrink-0">
        <span class="text-white text-[13px] font-bold">H</span>
      </div>
      <h1 class="text-[17px] md:text-[19px] font-bold tracking-tight truncate" :class="inkCls">{{ title }}</h1>
    </div>
    <AppThemeSwitcher />
  </header>
</template>
