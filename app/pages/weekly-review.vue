<script setup lang="ts">
definePageMeta({ tab: 'weeklyReview' })

const { open } = useModal()
const { review } = useWeeklyReview()
const { entries, loggedThisWeek, goal, target, weekDelta, totalDelta, toTarget, history, chart } = useWeighIns()

const tiles = computed(() => review.value
  ? [[review.value.avgCalories, 'Avg calories'], [review.value.proteinHit, 'Protein hit'], [review.value.workouts, 'Workouts'], [review.value.avgSleep, 'Avg sleep']]
  : [])

const toneCls = (kg: number | null) => kg === null ? inkSoftCls : DELTA_TONE_CLS[deltaTone(kg, goal.value)]

const progress = computed(() => {
  const rows: { label: string, value: string, cls: string }[] = []
  if (weekDelta.value !== null) rows.push({ label: 'This week', value: formatDelta(weekDelta.value), cls: toneCls(weekDelta.value) })
  if (totalDelta.value !== null) rows.push({ label: `Since ${formatWeek(entries.value[0]!.week)}`, value: formatDelta(totalDelta.value), cls: toneCls(totalDelta.value) })
  if (toTarget.value !== null) rows.push({ label: 'To target', value: toTarget.value > 0 ? `${toTarget.value} kg to go` : 'Reached', cls: inkCls })
  return rows
})

const pctX = (x: number) => `${(x / chart.value!.width) * 100}%`
const pctY = (y: number) => `${(y / chart.value!.height) * 100}%`
</script>

<template>
  <div v-if="review" class="max-w-[760px]">
    <div class="text-[14px] mb-[18px]" :class="inkFaintCls">{{ review.range }}</div>
    <div class="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-4 md:gap-5 mb-4">
      <div class="rounded-2xl p-5 shadow-xs flex flex-col" :class="cardCls">
        <div class="flex justify-between items-baseline mb-3">
          <span class="text-[14px]" :class="inkSoftCls">Weight trend</span>
          <span v-if="weekDelta !== null" class="text-[15px] font-bold" :class="toneCls(weekDelta)">{{ formatDelta(weekDelta) }} this week</span>
          <span v-else-if="entries.length" class="text-[15px] font-bold" :class="inkCls">{{ entries[0]!.weight }} kg</span>
        </div>

        <template v-if="chart">
          <!-- Lines stretch with the card; dots and the target label are HTML so they never distort. -->
          <div class="relative h-[120px] mb-4" role="img" :aria-label="`Weight over ${entries.length} weeks${target !== null ? `, target ${target} kg` : ''}`">
            <svg class="absolute inset-0 w-full h-full overflow-visible" :viewBox="`0 0 ${chart.width} ${chart.height}`" preserveAspectRatio="none" aria-hidden="true">
              <line v-if="chart.targetY !== null" x1="0" :x2="chart.width" :y1="chart.targetY" :y2="chart.targetY" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 5" vector-effect="non-scaling-stroke" :class="ACCENT.coral.icon" />
              <polyline v-if="chart.points.length > 1" :points="chart.line" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" :class="linkBlueCls" />
            </svg>
            <span
              v-for="p in chart.points"
              :key="p.week"
              class="absolute w-2.5 h-2.5 -ml-[5px] -mt-[5px] rounded-full border-2 border-accent-blue dark:border-accent-blue-dark"
              :class="cardCls"
              :style="{ left: pctX(p.x), top: pctY(p.y) }"
              :title="`${formatWeek(p.week)}: ${p.weight} kg`"
            />
            <span
              v-if="chart.targetY !== null"
              class="absolute right-0 -translate-y-full pb-1 text-[11.5px] font-semibold"
              :class="ACCENT.coral.icon"
              :style="{ top: pctY(chart.targetY) }"
            >Target {{ target }} kg</span>
          </div>
          <div v-if="progress.length" class="grid gap-2 mb-4" :class="progress.length === 3 ? 'grid-cols-3' : 'grid-cols-2'">
            <div v-for="row in progress" :key="row.label">
              <div class="text-[12px]" :class="inkFaintCls">{{ row.label }}</div>
              <div class="text-[14px] font-semibold" :class="row.cls">{{ row.value }}</div>
            </div>
          </div>
        </template>
        <p v-else class="text-[14px] mb-4" :class="inkSoftCls">Log your first weigh-in to start your trend.</p>

        <button type="button" class="mt-auto h-10 rounded-full text-[14px] font-semibold" :class="loggedThisWeek ? ['border', dividerCls, inkCls] : 'bg-ink text-white dark:bg-white dark:text-black'" @click="open('weighIn')">
          {{ loggedThisWeek ? 'Update this week' : 'Log this week' }}
        </button>
      </div>
      <div class="bg-ink rounded-2xl p-5">
        <div class="text-[14.5px] font-semibold text-white mb-2">Coach's recommendation</div>
        <div class="text-[13.5px] text-white/70 leading-relaxed">{{ review.recommendation }}</div>
      </div>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      <div v-for="[val, label] in tiles" :key="label" class="rounded-2xl p-4 shadow-xs" :class="cardCls">
        <div class="text-[19px] font-bold" :class="inkCls">{{ val }}</div>
        <div class="text-xs" :class="inkFaintCls">{{ label }}</div>
      </div>
    </div>
    <div v-if="history.length" class="rounded-2xl overflow-hidden shadow-xs" :class="cardCls">
      <div class="px-[18px] pt-4 pb-2 text-[14px]" :class="inkSoftCls">Weigh-ins</div>
      <div v-for="(row, i) in history" :key="row.week" class="grid grid-cols-[1fr_auto_5.5rem] items-baseline gap-3 px-[18px] py-3" :class="i < history.length - 1 ? ['border-b', dividerCls] : ''" data-testid="weigh-in-row">
        <div class="min-w-0">
          <div class="text-[14.5px] font-semibold" :class="inkCls">{{ formatWeek(row.week) }}</div>
          <div class="text-[12.5px]" :class="inkFaintCls">{{ row.activity }}</div>
        </div>
        <div class="text-[14.5px] font-semibold text-right" :class="inkCls">{{ row.weight }} kg</div>
        <div class="text-[13px] font-semibold text-right" :class="toneCls(row.delta)">{{ row.delta === null ? 'First' : formatDelta(row.delta) }}</div>
      </div>
    </div>
  </div>
</template>
