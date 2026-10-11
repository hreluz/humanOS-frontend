<script setup lang="ts">
definePageMeta({ tab: 'goals' })

const { templates, selected, formattedTarget, label, creating, select, reset, changeTarget, create } = useNewGoal()
</script>

<template>
  <div class="max-w-[480px]">
    <NuxtLink to="/goals" class="block text-[13.5px] font-semibold mb-4" :class="linkBlueCls">← Back to goals</NuxtLink>
    <template v-if="selected">
      <button type="button" class="block text-[13.5px] font-semibold mb-4" :class="linkBlueCls" @click="reset">← Choose a different type</button>
      <div class="text-[13px] font-bold tracking-wide uppercase mb-2" :class="inkFaintCls">{{ selected.label }}</div>
      <div class="rounded-2xl p-7 flex flex-col items-center shadow-xs mb-5" :class="cardCls">
        <div class="text-4xl font-bold tracking-tight mb-[18px]" :class="inkCls" aria-live="polite">{{ formattedTarget }}</div>
        <div class="flex items-center gap-[22px]">
          <button type="button" aria-label="Decrease target" class="w-10 h-10 rounded-full flex items-center justify-center text-xl" :class="[bgCls, inkCls]" @click="changeTarget(-1)">–</button>
          <button type="button" aria-label="Increase target" class="w-10 h-10 rounded-full flex items-center justify-center text-xl text-white" :class="ACCENT[selected.accent].bar" @click="changeTarget(1)">+</button>
        </div>
      </div>
      <div class="rounded-2xl px-4 py-3.5 mb-5 text-center text-[14.5px]" :class="[bgCls, inkSoftCls]">"{{ label }}"</div>
      <button type="button" :disabled="creating" class="w-full h-[50px] rounded-full bg-ink text-white flex items-center justify-center text-[15px] font-semibold disabled:opacity-60" @click="create">Create goal</button>
    </template>
    <template v-else>
      <div class="text-[15px] mb-4" :class="inkSoftCls">What do you want to track?</div>
      <div class="flex flex-col gap-2.5">
        <button
          v-for="tpl in templates ?? []"
          :key="tpl.key"
          type="button"
          class="rounded-2xl px-4 py-3.5 flex items-center gap-3.5 shadow-xs text-left"
          :class="cardCls"
          @click="select(tpl.key)"
        >
          <div class="w-9 h-9 rounded-[11px] flex items-center justify-center shrink-0" :class="ACCENT[tpl.accent].iconBg">
            <AppIcon :path="tpl.icon" class="w-[17px] h-[17px]" :class="ACCENT[tpl.accent].icon" />
          </div>
          <div class="flex-1">
            <div class="text-[14.5px] font-bold" :class="inkCls">{{ tpl.label }}</div>
            <div class="text-[12.5px] mt-0.5" :class="inkFaintCls">{{ tpl.hint }}</div>
          </div>
        </button>
      </div>
    </template>
  </div>
</template>
