<script setup lang="ts">
const props = defineProps<{ activeTab?: string }>()
const { open } = useModal()
const { openQuickLog } = useQuickLogLauncher()
</script>

<template>
  <nav class="hidden md:flex w-[240px] shrink-0 border-r flex-col p-4" :class="[cardCls, dividerCls]">
    <div class="flex items-center gap-2.5 px-2 mb-6">
      <AppLogo />
      <span class="text-[16px] font-bold tracking-tight" :class="inkCls">HumanOS</span>
    </div>

    <button
      type="button"
      class="mb-5 h-10 rounded-[10px] bg-ink text-white dark:bg-white dark:text-black text-[14px] font-semibold flex items-center justify-center gap-2"
      :class="focusRingCls"
      @click="openQuickLog()"
    >
      <AppIcon :path="ICONS.plus" class="w-4 h-4" />
      Log
    </button>

    <div class="flex flex-col gap-0.5">
      <NuxtLink
        v-for="nav in NAV_DEFS"
        :key="nav.key"
        :to="nav.to"
        class="flex items-center gap-3 px-3 py-2.5 rounded-[10px]"
        :class="props.activeTab === nav.key ? bgCls : ''"
        :aria-current="props.activeTab === nav.key ? 'page' : undefined"
      >
        <AppIcon :path="nav.icon" class="w-[18px] h-[18px]" :class="props.activeTab === nav.key ? inkCls : inkFaintCls" />
        <span class="text-[14.5px]" :class="props.activeTab === nav.key ? ['font-semibold', inkCls] : ['font-medium', inkSoftCls]">{{ nav.label }}</span>
      </NuxtLink>
    </div>

    <div class="flex-1" />

    <button type="button" class="bg-ink rounded-2xl p-3.5 flex items-center gap-2.5 mb-3 text-left" @click="open('coach')">
      <div class="w-8 h-8 rounded-[10px] bg-white/10 flex items-center justify-center shrink-0">
        <AppIcon :path="ICONS.coach" class="w-4 h-4 text-white" />
      </div>
      <div>
        <div class="text-[13px] font-semibold text-white">Ask your coach</div>
        <div class="text-[11.5px] text-white/50">New insight available</div>
      </div>
    </button>

    <AppAccountMenu />
  </nav>
</template>
