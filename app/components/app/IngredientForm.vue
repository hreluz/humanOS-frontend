<script setup lang="ts">
import type { FoodItem, PortionUnit } from '~/types/food'

/** With `food`, the form edits that saved food instead of creating one. */
const props = defineProps<{ initialName?: string, submitLabel: string, food?: FoodItem }>()
const emit = defineEmits<{ created: [food: FoodItem], updated: [food: FoodItem] }>()
const { newFood, amount, priceInvalid, missing, parsedFood, creating, save } = useIngredientForm(props.initialName, props.food)

const UNITS: { key: PortionUnit, label: string }[] = [
  { key: 'g', label: 'g' }, { key: 'ml', label: 'ml' }, { key: 'piece', label: 'piece' }, { key: 'serving', label: 'serving' },
]
const unit = computed({ get: () => newFood.value.unit, set: (v) => { newFood.value.unit = v } })
const { tabindex, onKeydown } = useRadioGroup(UNITS.map(u => u.key), unit)
const MACRO_FIELDS = [['p', 'Protein'], ['c', 'Carbs'], ['f', 'Fat']] as const
const ringWithinCls = 'focus-within:ring-2 focus-within:ring-ink/40 dark:focus-within:ring-white/50'
const fieldCls = ['block rounded-xl px-3.5 py-2.5', ringWithinCls, bgCls]
// 16px on phones so iOS doesn't zoom into the field on focus.
const inputTextCls = ['bg-transparent outline-hidden text-base sm:text-[15px] font-semibold placeholder:text-black/25 dark:placeholder:text-white/25', inkCls]
const fieldInputCls = ['w-full', inputTextCls]
const perId = useId()
const perErrorId = useId()
const missingId = useId()
const perTouched = ref(false)
const perInvalid = computed(() => perTouched.value && !amount.value)
const priceId = useId()
const priceErrorId = useId()
const priceTouched = ref(false)
const showPriceError = computed(() => priceTouched.value && priceInvalid.value)
// The price is for the same portion as the nutrition: "Price (USD, per 100 g)".
const priceLabel = computed(() => amount.value
  ? `Price (USD, per ${formatPortion({ unit: newFood.value.unit } as FoodItem, amount.value)})`
  : 'Price (USD)')

const nameInput = ref<HTMLInputElement>()
const kcalInput = ref<HTMLInputElement>()
// The first required field still empty: calories when the name came from a search. Editing starts at the name.
onMounted(() => (newFood.value.name.trim() && !props.food ? kcalInput : nameInput).value?.focus())

async function onSubmit() {
  const food = await save()
  if (!food) return
  if (props.food) emit('updated', food)
  else emit('created', food)
}
</script>

<template>
  <form class="flex-1 flex flex-col gap-3" @submit.prevent="onSubmit">
    <label :class="fieldCls">
      <span class="block text-xs mb-1" :class="inkFaintCls">Ingredient name</span>
      <input ref="nameInput" v-model="newFood.name" placeholder="e.g. Tahini" autocomplete="off" :class="fieldInputCls">
    </label>
    <label :class="fieldCls">
      <span class="block text-xs mb-1" :class="inkFaintCls">Category (optional)</span>
      <select v-model="newFood.category" class="dark:[color-scheme:dark]" :class="fieldInputCls">
        <option value="">No category</option>
        <option v-for="cat in CATEGORIES" :key="cat.key" :value="cat.key">{{ cat.label }}</option>
      </select>
    </label>
    <div class="rounded-xl px-3.5 py-2.5" :class="[ringWithinCls, bgCls]">
      <label class="block text-xs mb-1" :class="inkFaintCls" :for="perId">Nutrition per</label>
      <div class="flex items-center gap-2">
        <input
          :id="perId"
          v-model="newFood.per"
          inputmode="decimal"
          autocomplete="off"
          class="w-14 shrink-0"
          :class="inputTextCls"
          :aria-invalid="perInvalid"
          :aria-describedby="perInvalid ? perErrorId : undefined"
          @blur="perTouched = true"
        >
        <div class="flex-1 grid grid-cols-4 gap-1 p-1 rounded-lg" :class="cardCls" role="radiogroup" aria-label="Unit" @keydown="onKeydown">
          <button
            v-for="u in UNITS"
            :key="u.key"
            type="button"
            role="radio"
            :aria-checked="newFood.unit === u.key"
            :tabindex="tabindex(u.key)"
            class="min-h-11 sm:min-h-8 rounded-md text-[12.5px] font-semibold"
            :class="[focusRingCls, newFood.unit === u.key ? segmentOnCls : inkSoftCls]"
            @click="newFood.unit = u.key"
          >
            {{ u.label }}
          </button>
        </div>
      </div>
      <div v-if="perInvalid" :id="perErrorId" class="text-xs mt-1.5 text-accent-coral dark:text-accent-coral-dark">Enter an amount like 100 or 1.5.</div>
    </div>
    <label :class="fieldCls">
      <span class="block text-xs mb-1" :class="inkFaintCls">Calories (kcal)</span>
      <input ref="kcalInput" v-model="newFood.kcal" inputmode="numeric" placeholder="0" autocomplete="off" :class="fieldInputCls">
    </label>
    <div class="grid grid-cols-3 gap-2">
      <label v-for="[key, label] in MACRO_FIELDS" :key="key" :class="fieldCls">
        <span class="block text-xs mb-1" :class="inkFaintCls">{{ label }} (g)</span>
        <input v-model="newFood[key]" inputmode="decimal" placeholder="0" autocomplete="off" :class="fieldInputCls">
      </label>
    </div>
    <div :class="fieldCls">
      <label class="block text-xs mb-1" :class="inkFaintCls" :for="priceId">{{ priceLabel }}</label>
      <div class="flex items-center gap-1">
        <span aria-hidden="true" :class="inputTextCls">$</span>
        <input
          :id="priceId"
          v-model="newFood.price"
          inputmode="decimal"
          placeholder="0.00"
          autocomplete="off"
          :class="fieldInputCls"
          :aria-invalid="showPriceError"
          :aria-describedby="showPriceError ? priceErrorId : undefined"
          @blur="priceTouched = true"
        >
      </div>
      <div v-if="showPriceError" :id="priceErrorId" class="text-xs mt-1.5 text-accent-coral dark:text-accent-coral-dark">Enter a price like 1.10.</div>
    </div>
    <div class="mt-auto flex flex-col gap-2 pt-1">
      <p v-if="missing" :id="missingId" class="text-[13px] text-center" :class="inkFaintCls">{{ missing }}</p>
      <button type="submit" :aria-describedby="missing ? missingId : undefined" :disabled="!parsedFood || creating" class="w-full h-[46px] shrink-0 rounded-full bg-ink text-white dark:bg-white dark:text-black flex items-center justify-center text-[14.5px] font-semibold disabled:opacity-40" :class="focusRingCls">
        {{ creating ? 'Saving…' : submitLabel }}
      </button>
    </div>
  </form>
</template>
