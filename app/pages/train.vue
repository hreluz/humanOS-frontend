<script setup lang="ts">
definePageMeta({ tab: 'train' })

const { workout } = useTraining()
const { log } = useTodayActivity()
const logged = computed(() => log.value.filter(e => e.kind === 'activity'))
</script>

<template>
  <div v-if="workout" class="max-w-[820px]">
    <div class="text-[15px] mb-[18px]" :class="inkSoftCls">{{ workout.title }} · {{ workout.durationMin }} min · {{ workout.volume }} volume</div>
    <div class="flex flex-col gap-3 mb-6">
      <section v-for="ex in workout.exercises" :key="ex.name" class="rounded-2xl px-5 py-[18px] shadow-xs" :class="cardCls">
        <div class="flex justify-between items-center mb-2.5">
          <h2 class="text-[16px] font-bold" :class="inkCls">{{ ex.name }}</h2>
          <span class="text-[13px]" :class="inkFaintCls">{{ ex.equip }}</span>
        </div>
        <div class="flex gap-2 flex-wrap">
          <div v-for="(s, i) in ex.sets" :key="i" class="rounded-[10px] px-3 py-1.5 text-[13px]" :class="[bgCls, inkCls]">{{ s }}</div>
        </div>
      </section>
    </div>
    <div class="text-[13px] font-bold tracking-wide uppercase mb-2.5" :class="inkFaintCls">Cardio &amp; activity</div>
    <div class="flex flex-col gap-3">
      <div v-for="c in workout.cardio" :key="c.name" class="rounded-2xl px-5 py-4 shadow-xs flex gap-3.5 items-center" :class="cardCls">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" :class="ACCENT.green.iconBg">
          <AppIcon :path="c.icon" class="w-[19px] h-[19px]" :class="ACCENT.green.icon" />
        </div>
        <div>
          <div class="text-[15.5px] font-bold" :class="inkCls">{{ c.name }}</div>
          <div class="text-[13.5px]" :class="inkSoftCls">{{ c.detail }}</div>
        </div>
      </div>
      <div v-for="e in logged" :key="e.id" class="rounded-2xl px-5 py-4 shadow-xs flex gap-3.5 items-center" :class="cardCls">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" :class="ACCENT.green.iconBg">
          <AppIcon :path="e.icon" class="w-[19px] h-[19px]" :class="ACCENT.green.icon" />
        </div>
        <div>
          <div class="text-[15.5px] font-bold" :class="inkCls">{{ e.label }}</div>
          <div class="text-[13.5px]" :class="inkSoftCls">{{ formatActivityAmount(e.unit, e.amount) }} · {{ e.kcal }} kcal · logged at {{ formatLogTime(e.loggedAt) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
