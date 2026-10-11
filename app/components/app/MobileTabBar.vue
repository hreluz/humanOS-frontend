<script setup lang="ts">
defineProps<{ activeTab?: string }>()
</script>

<template>
  <nav class="md:hidden fixed bottom-0 inset-x-0 border-t flex items-stretch justify-around z-30" :class="[cardCls, dividerCls]" style="padding-bottom: env(safe-area-inset-bottom)">
    <NuxtLink
      v-for="nav in NAV_DEFS"
      :key="nav.key"
      :to="nav.to"
      class="flex flex-col items-center justify-center gap-1 py-2 flex-1"
      :aria-current="activeTab === nav.key ? 'page' : undefined"
    >
      <AppIcon :path="nav.icon" class="w-5 h-5" :class="activeTab === nav.key ? inkCls : inkFaintCls" />
      <span class="text-[10px]" :class="activeTab === nav.key ? ['font-semibold', inkCls] : ['font-medium', inkFaintCls]">{{ nav.label }}</span>
    </NuxtLink>
  </nav>
</template>
