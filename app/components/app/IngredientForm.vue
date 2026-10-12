<script setup lang="ts">
import type { FoodItem, PortionUnit } from '~/types/food'

const props = defineProps<{ initialName?: string, submitLabel: string }>()
const emit = defineEmits<{ created: [food: FoodItem] }>()
const { newFood, parsedFood, creating, create } = useIngredientForm(props.initialName)

const UNITS: { key: PortionUnit, label: string }[] = [
  { key: 'g', label: 'g' }, { key: 'ml', label: 'ml' }, { key: 'piece', label: 'piece' }, { key: 'serving', label: 'serving' },
]
const unit = computed({ get: () => newFood.value.unit, set: (v) => { newFood.value.unit = v } })
const { tabindex, onKeydown } = useRadioGroup(UNITS.map(u => u.key), unit)
const MACRO_FIELDS = [['p', 'Protein'], ['c', 'Carbs'], ['f', 'Fat']] as const
const fieldCls = ['block rounded-xl px-3.5 py-2.5', bgCls]
const inputTextCls = ['bg-transparent outline-hidden text-[15px] font-semibold placeholder:text-black/25 dark:placeholder:text-white/25', inkCls]
const fieldInputCls = ['w-full', inputTextCls]
const perId = useId()

async function onSubmit() {
  const food = await create()
  if (food) emit('created', food)
}
</script>

<template>
  <form class="flex-1 flex flex-col gap-3" @submit.prevent="onSubmit">
    <label :class="fieldCls">
      <span class="block text-xs mb-1" :class="inkFaintCls">Ingredient name</span>
      <input v-model="newFood.name" placeholder="e.g. Tahini" autocomplete="off" :class="fieldInputCls">
    </label>
    <div class="rounded-xl px-3.5 py-2.5" :class="bgCls">
      <label class="block text-xs mb-1" :class="inkFaintCls" :for="perId">Nutrition per</label>
      <div class="flex items-center gap-2">
        <input :id="perId" v-model="newFood.per" inputmode="decimal" autocomplete="off" class="w-14 shrink-0" :class="inputTextCls">
        <div class="flex-1 grid grid-cols-4 gap-1 p-1 rounded-lg" :class="cardCls" role="radiogroup" aria-label="Unit" @keydown="onKeydown">
          <button
            v-for="u in UNITS"
            :key="u.key"
            type="button"
            role="radio"
            :aria-checked="newFood.unit === u.key"
            :tabindex="tabindex(u.key)"
            class="min-h-8 rounded-md text-[12.5px] font-semibold"
            :class="[focusRingCls, newFood.unit === u.key ? segmentOnCls : inkSoftCls]"
            @click="newFood.unit = u.key"
          >
            {{ u.label }}
          </button>
        </div>
      </div>
    </div>
    <label :class="fieldCls">
      <span class="block text-xs mb-1" :class="inkFaintCls">Calories (kcal)</span>
      <input v-model="newFood.kcal" inputmode="numeric" placeholder="0" autocomplete="off" :class="fieldInputCls">
    </label>
    <div class="grid grid-cols-3 gap-2">
      <label v-for="[key, label] in MACRO_FIELDS" :key="key" :class="fieldCls">
        <span class="block text-xs mb-1" :class="inkFaintCls">{{ label }} (g)</span>
        <input v-model="newFood[key]" inputmode="decimal" placeholder="0" autocomplete="off" :class="fieldInputCls">
      </label>
    </div>
    <button type="submit" :disabled="!parsedFood || creating" class="mt-auto w-full h-[46px] shrink-0 rounded-full bg-ink text-white dark:bg-white dark:text-black flex items-center justify-center text-[14.5px] font-semibold disabled:opacity-40" :class="focusRingCls">
      {{ submitLabel }}
    </button>
  </form>
</template>
