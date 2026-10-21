<script setup lang="ts">
definePageMeta({ tab: 'food' })

const { open } = useModal()
const { openQuickLog } = useQuickLogLauncher()
const { mealSections, summary } = useFoodLog()
const btnCls = ['px-3.5 py-2 rounded-[10px] text-[13px] font-semibold shadow-xs', cardCls, inkCls]
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-[1fr_340px] gap-4 md:gap-6 max-w-[1160px]">
    <div class="flex flex-col gap-3.5">
      <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <span class="text-[15px] whitespace-nowrap" :class="inkSoftCls">Today's log</span>
        <div class="grid grid-cols-2 sm:flex sm:flex-wrap sm:justify-end gap-2">
          <button type="button" :class="btnCls" @click="open('ingredient')">New ingredient</button>
          <NuxtLink to="/food/recipes/new" class="text-center" :class="btnCls">New recipe</NuxtLink>
          <NuxtLink to="/food/my-foods" class="text-center" :class="btnCls">My foods</NuxtLink>
          <button type="button" :class="btnCls" @click="open('planner')">Meal planner</button>
          <button type="button" class="col-span-2 px-3.5 py-2 rounded-[10px] bg-ink text-[13px] font-semibold text-white" @click="openQuickLog('food')">+ Log food</button>
        </div>
      </div>

      <section v-for="meal in mealSections" :key="meal.key" class="rounded-2xl px-5 py-[18px] shadow-xs" :class="cardCls">
        <div class="flex justify-between items-center mb-2">
          <h2 class="text-[15px] font-bold" :class="inkCls">{{ meal.label }}</h2>
          <span class="text-[13px]" :class="inkFaintCls">{{ meal.kcal }} kcal</span>
        </div>
        <template v-if="meal.items.length">
          <div v-for="(item, i) in meal.items" :key="i" class="flex justify-between py-2 border-t" :class="dividerCls">
            <span class="text-[14.5px]" :class="inkCls">{{ item.name }}<span v-if="item.portion" :class="inkFaintCls">, {{ item.portion }}</span></span>
            <span class="text-[14px]" :class="inkSoftCls">{{ item.kcal }} kcal</span>
          </div>
        </template>
        <div v-else class="text-[13.5px]" :class="inkFaintCls">Not logged</div>
      </section>
    </div>

    <div class="flex flex-col gap-4">
      <div v-if="summary" class="rounded-2xl p-5 shadow-xs" :class="cardCls">
        <div class="flex justify-between items-baseline mb-2.5">
          <span class="text-[14px]" :class="inkSoftCls">Calories</span>
          <span class="text-[15px] font-bold" :class="inkCls" data-testid="kcal-total">{{ summary.kcal.value.toLocaleString('en-US') }} / {{ summary.kcal.target.toLocaleString('en-US') }}</span>
        </div>
        <div class="mb-4"><AppProgressBar :pct="summary.kcal.pct" accent="coral" /></div>
        <div class="flex flex-col gap-3">
          <div v-for="m in ([['Protein', summary.protein, 'blue'], ['Carbs', summary.carbs, 'amber'], ['Fat', summary.fat, 'violet']] as const)" :key="m[0]">
            <div class="flex justify-between text-[13px] mb-1.5"><span class="font-semibold" :class="inkCls">{{ m[0] }}</span><span :class="inkFaintCls">{{ m[1].value }}/{{ m[1].target }}</span></div>
            <AppProgressBar :pct="m[1].pct" :accent="m[2]" />
          </div>
        </div>
      </div>
      <button type="button" class="rounded-2xl px-[18px] py-4 shadow-xs flex items-center justify-between" :class="cardCls" @click="open('grocery')">
        <span class="text-[14px] font-semibold" :class="inkCls">Grocery list</span>
        <AppIcon :path="ICONS.chevronRight" class="w-3 h-3" :class="inkFaintCls" />
      </button>
    </div>
  </div>
</template>
