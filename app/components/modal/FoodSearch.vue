<script setup lang="ts">
import type { FoodItem } from '~/types/food'

const { close } = useModal()
const { query, tab, results } = useFoodSearch()
const { addFood } = useFoodLog()

async function add(item: FoodItem) {
  await addFood(item)
  close()
}
</script>

<template>
  <ModalShell label="Log food">
    <div class="p-5 border-b flex items-center gap-3" :class="dividerCls">
      <label class="flex-1 rounded-xl px-3.5 py-2.5 flex items-center gap-2" :class="bgCls">
        <AppIcon :path="ICONS.search" class="w-[15px] h-[15px]" :class="inkFaintCls" />
        <input
          v-model="query"
          type="search"
          placeholder="Search foods"
          aria-label="Search foods"
          class="flex-1 min-w-0 bg-transparent outline-hidden text-[14.5px] placeholder:text-black/30 dark:placeholder:text-white/30"
          :class="inkCls"
        >
      </label>
      <ModalCloseButton />
    </div>
    <div class="px-5 pt-3 flex gap-2">
      <button
        v-for="t in FOOD_SEARCH_TABS"
        :key="t.key"
        type="button"
        class="px-3 py-1.5 rounded-[10px] text-[12.5px] font-semibold"
        :class="tab === t.key ? 'bg-ink text-white dark:bg-white dark:text-black' : inkSoftCls"
        @click="tab = t.key"
      >
        {{ t.label }}
      </button>
    </div>
    <div class="flex-1 overflow-auto px-5 pb-5 pt-3 flex flex-col gap-2">
      <div v-for="food in results ?? []" :key="food.id" class="rounded-2xl px-3.5 py-3 flex items-center gap-3" :class="bgCls">
        <div class="w-9 h-9 rounded-[10px] shrink-0" :class="cardCls" />
        <div class="flex-1">
          <div class="text-[14.5px] font-semibold" :class="inkCls">{{ food.name }}</div>
          <div class="text-xs" :class="inkFaintCls">{{ food.brand }} · {{ food.serving }} · {{ food.kcal }} kcal</div>
        </div>
        <button
          type="button"
          :aria-label="`Add ${food.name}`"
          class="w-7 h-7 rounded-full bg-ink text-white flex items-center justify-center text-base shrink-0"
          @click="add(food)"
        >
          +
        </button>
      </div>
      <div v-if="results && !results.length" class="text-[13.5px] py-6 text-center" :class="inkFaintCls">No foods found</div>
    </div>
  </ModalShell>
</template>
