<script setup lang="ts">
const { open } = useModal()
const { days, day, plan } = useMealPlanner()
</script>

<template>
  <ModalShell label="Meal planner">
    <div class="p-5 border-b flex items-center justify-between" :class="dividerCls">
      <span class="text-base font-bold" :class="inkCls">Meal Planner</span>
      <ModalCloseButton />
    </div>
    <div class="px-5 pt-3.5">
      <div class="flex justify-between gap-1.5">
        <button
          v-for="(d, idx) in days"
          :key="d"
          type="button"
          class="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl"
          :class="day === d ? 'bg-ink' : ''"
          :aria-pressed="day === d"
          @click="day = d"
        >
          <span class="text-[10.5px]" :class="day === d ? 'text-white/60' : inkFaintCls">{{ d }}</span>
          <span class="text-[13px] font-semibold" :class="day === d ? 'text-white' : inkCls">{{ idx + 1 }}</span>
        </button>
      </div>
    </div>
    <div class="flex-1 overflow-auto px-5 pb-5 pt-4">
      <template v-if="plan">
        <div class="rounded-2xl px-3.5 py-3 mb-3 flex justify-between items-center" :class="bgCls">
          <span class="text-[13px]" :class="inkSoftCls">Planned for {{ plan.day }}</span>
          <span class="text-sm font-bold" :class="inkCls">{{ plan.plannedKcal.toLocaleString('en-US') }} / {{ plan.targetKcal.toLocaleString('en-US') }} kcal</span>
        </div>
        <div class="flex flex-col gap-2">
          <div v-for="meal in plan.meals" :key="meal.label" class="rounded-xl px-3.5 py-3 flex justify-between items-center" :class="bgCls">
            <div>
              <div class="text-[11px] uppercase mb-0.5" :class="inkFaintCls">{{ meal.label }}</div>
              <div class="text-sm font-semibold" :class="inkCls">{{ meal.name }}</div>
            </div>
            <span class="text-[12.5px]" :class="inkFaintCls">{{ meal.kcal }} kcal</span>
          </div>
        </div>
      </template>
      <button type="button" class="w-full h-11 rounded-full bg-ink text-white flex items-center justify-center text-[13.5px] font-semibold mt-[18px]" @click="open('grocery')">Generate grocery list</button>
    </div>
  </ModalShell>
</template>
