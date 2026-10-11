<script setup lang="ts">
definePageMeta({ tab: 'home' })

const { open } = useModal()
const { firstName } = useAuth()
const greeting = useGreeting()
const { summary } = useFoodLog()
const { steps } = useTodayActivity()
const { review } = useWeeklyReview()
const { tip } = useCoachTip()

const fmt = (n: number) => n.toLocaleString('en-US')
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-[1.6fr_1fr] gap-4 md:gap-6 max-w-[1160px]">
    <div class="flex flex-col gap-4">
      <div class="text-[15px]" :class="inkSoftCls">{{ greeting }}, {{ firstName }} — here's your plan to hit today's goal.</div>

      <div v-if="summary" class="rounded-2xl p-[22px] shadow-xs" :class="cardCls">
        <div class="flex gap-3.5 items-center mb-3.5">
          <div class="w-11 h-11 rounded-[13px] flex items-center justify-center shrink-0" :class="ACCENT.blue.iconBg">
            <AppIcon :path="ICONS.protein" class="w-5 h-5" :class="ACCENT.blue.icon" />
          </div>
          <div class="flex-1">
            <div class="text-[17px] font-bold" :class="inkCls">Eat {{ summary.protein.remaining }}g more protein</div>
            <div class="text-[14px] mt-0.5" :class="inkSoftCls">{{ summary.protein.value }}g of {{ summary.protein.target }}g — dinner is your chance</div>
          </div>
        </div>
        <AppProgressBar :pct="summary.protein.pct" accent="blue" />
      </div>

      <div v-if="steps" class="rounded-2xl p-[22px] shadow-xs" :class="cardCls">
        <div class="flex gap-3.5 items-center mb-3.5">
          <div class="w-11 h-11 rounded-[13px] flex items-center justify-center shrink-0" :class="ACCENT.green.iconBg">
            <AppIcon :path="ICONS.steps" class="w-5 h-5" :class="ACCENT.green.icon" />
          </div>
          <div class="flex-1">
            <div class="text-[17px] font-bold" :class="inkCls">Walk {{ fmt(steps.remaining) }} more steps</div>
            <div class="text-[14px] mt-0.5" :class="inkSoftCls">{{ fmt(steps.value) }} of {{ fmt(steps.goal) }} — an evening walk covers it</div>
          </div>
        </div>
        <AppProgressBar :pct="steps.pct" accent="green" />
      </div>

      <button v-if="summary" type="button" class="rounded-2xl p-[22px] shadow-xs text-left" :class="cardCls" @click="open('foodSearch')">
        <div class="flex gap-3.5 items-center mb-3.5">
          <div class="w-11 h-11 rounded-[13px] flex items-center justify-center shrink-0" :class="ACCENT.coral.iconBg">
            <svg class="w-5 h-5" :class="ACCENT.coral.icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" />
              <path d="M12 7v5l3.5 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
          </div>
          <div class="flex-1">
            <div class="text-[17px] font-bold" :class="inkCls" data-testid="kcal-remaining">You can still eat {{ summary.kcal.remaining }} kcal</div>
            <div class="text-[14px] mt-0.5" :class="inkSoftCls">Click to log tonight's dinner</div>
          </div>
        </div>
        <AppProgressBar :pct="summary.kcal.pct" accent="coral" />
      </button>
    </div>

    <div class="flex flex-col gap-4">
      <button type="button" class="bg-[#0B0B0C] rounded-2xl p-[22px] text-left" @click="open('coach')">
        <div class="flex gap-3 items-center mb-2.5">
          <div class="w-9 h-9 rounded-[11px] bg-white/10 flex items-center justify-center shrink-0">
            <AppIcon :path="ICONS.coach" class="w-[17px] h-[17px] text-white" />
          </div>
          <div class="text-[15px] font-semibold text-white">Coach's tip for today</div>
        </div>
        <div class="text-[13.5px] text-white/65 leading-relaxed">{{ tip }}</div>
      </button>

      <div v-if="review" class="rounded-2xl p-5 shadow-xs" :class="cardCls">
        <div class="text-[13px] font-bold tracking-wide uppercase mb-3.5" :class="inkFaintCls">This week</div>
        <div class="flex flex-col gap-3">
          <div class="flex justify-between"><span class="text-[14px]" :class="inkSoftCls">Avg calories</span><span class="text-[14px] font-semibold" :class="inkCls">{{ review.avgCalories }}</span></div>
          <div class="flex justify-between"><span class="text-[14px]" :class="inkSoftCls">Protein hit</span><span class="text-[14px] font-semibold" :class="inkCls">{{ review.proteinHit }} days</span></div>
          <div class="flex justify-between"><span class="text-[14px]" :class="inkSoftCls">Workouts</span><span class="text-[14px] font-semibold" :class="inkCls">{{ review.workouts }} done</span></div>
        </div>
        <NuxtLink to="/weekly-review" class="block mt-3.5 text-center text-[13px] font-semibold" :class="linkBlueCls">View full weekly review →</NuxtLink>
      </div>

      <NuxtLink to="/goals" class="rounded-2xl p-5 shadow-xs flex items-center justify-between" :class="cardCls">
        <span class="text-[14.5px] font-semibold" :class="inkCls">View all goals</span>
        <AppIcon :path="ICONS.chevronRight" class="w-3.5 h-3.5" :class="inkFaintCls" />
      </NuxtLink>
    </div>
  </div>
</template>
