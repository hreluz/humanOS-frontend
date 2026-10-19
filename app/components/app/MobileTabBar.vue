<script setup lang="ts">
defineProps<{ activeTab?: string }>()
const { openQuickLog } = useQuickLogLauncher()

// The log button sits in the middle of the bar, between the two halves of the tabs.
const half = Math.ceil(NAV_DEFS.length / 2)
const sides = [NAV_DEFS.slice(0, half), NAV_DEFS.slice(half)]
</script>

<template>
  <nav class="md:hidden fixed bottom-0 inset-x-0 border-t flex items-stretch justify-around z-30" :class="[cardCls, dividerCls]" style="padding-bottom: env(safe-area-inset-bottom)">
    <template v-for="(navs, side) in sides" :key="side">
      <div v-if="side === 1" class="flex-1 flex justify-center">
        <button
          type="button"
          aria-label="Log food, activity or water"
          class="-mt-4 w-12 h-12 rounded-full bg-ink text-white dark:bg-white dark:text-black flex items-center justify-center shadow-lg ring-4 ring-white dark:ring-surface-dark"
          :class="focusRingCls"
          @click="openQuickLog()"
        >
          <AppIcon :path="ICONS.plus" class="w-5 h-5" />
        </button>
      </div>
      <NuxtLink
        v-for="nav in navs"
        :key="nav.key"
        :to="nav.to"
        class="flex flex-col items-center justify-center gap-1 py-2 flex-1"
        :aria-current="activeTab === nav.key ? 'page' : undefined"
      >
        <AppIcon :path="nav.icon" class="w-5 h-5" :class="activeTab === nav.key ? inkCls : inkFaintCls" />
        <span class="text-[10px]" :class="activeTab === nav.key ? ['font-semibold', inkCls] : ['font-medium', inkFaintCls]">{{ nav.label }}</span>
      </NuxtLink>
    </template>
  </nav>
</template>
