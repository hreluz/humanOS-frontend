<script setup lang="ts">
import type { FoodItem } from '~/types/food'

/** With `food`, the form edits that saved food instead of creating one. Everything is per 100 g, as on a food label. */
const props = defineProps<{ initialName?: string, submitLabel: string, food?: FoodItem }>()
const emit = defineEmits<{ created: [food: FoodItem], updated: [food: FoodItem] }>()
const {
  newFood, missing, sumInvalid, priceInvalid, parsedFood, creating, fieldErrors, formError, addPortion, removePortion, save,
} = useIngredientForm(props.initialName, props.food)

const MACRO_FIELDS = [['p', 'Protein (g)'], ['c', 'Carbs (g)'], ['f', 'Fat (g)']] as const
const ringWithinCls = 'focus-within:ring-2 focus-within:ring-ink/40 dark:focus-within:ring-white/50'
const fieldCls = ['block rounded-xl px-3.5 py-2.5', ringWithinCls, bgCls]
// 16px on phones so iOS doesn't zoom into the field on focus.
const inputTextCls = ['bg-transparent outline-hidden text-base sm:text-[15px] font-semibold placeholder:text-black/25 dark:placeholder:text-white/25', inkCls]
const fieldInputCls = ['w-full', inputTextCls]
const labelCls = ['block text-xs mb-1', inkFaintCls]
const errorCls = 'text-xs mt-1.5 text-accent-coral dark:text-accent-coral-dark'
const id = useId()
const errId = (field: string) => `${id}-${field}-error`
/** aria-describedby for a field with an API error. */
const describedBy = (field: string) => fieldErrors.value[field] ? errId(field) : undefined

const missingId = `${id}-missing`
const priceTouched = ref(false)
const showPriceError = computed(() => priceTouched.value && priceInvalid.value)

const nameInput = ref<HTMLInputElement>()
const categorySelect = ref<HTMLSelectElement>()
// The first required field still empty: the category when the name came from a search. Editing starts at the name.
onMounted(() => (newFood.value.name.trim() && !props.food ? categorySelect : nameInput).value?.focus())

const portionLabels = ref<HTMLInputElement[]>([])
async function onAddPortion() {
  addPortion()
  await nextTick()
  portionLabels.value.at(-1)?.focus()
}

async function onSubmit() {
  const food = await save()
  if (!food) return
  if (props.food) emit('updated', food)
  else emit('created', food)
}
</script>

<template>
  <form class="flex-1 flex flex-col gap-3" @submit.prevent="onSubmit">
    <div>
      <label :class="fieldCls">
        <span :class="labelCls">Name</span>
        <input ref="nameInput" v-model="newFood.name" placeholder="e.g. Tahini" autocomplete="off" :class="fieldInputCls" :aria-invalid="!!fieldErrors.name" :aria-describedby="describedBy('name')">
      </label>
      <div v-if="fieldErrors.name" :id="errId('name')" :class="errorCls">{{ fieldErrors.name }}</div>
    </div>

    <div>
      <label :class="fieldCls">
        <span :class="labelCls">Category</span>
        <select ref="categorySelect" v-model="newFood.category" class="dark:[color-scheme:dark]" :class="fieldInputCls" :aria-invalid="!!fieldErrors.category" :aria-describedby="describedBy('category')">
          <option value="" disabled>Choose a category</option>
          <option v-for="cat in CATEGORIES" :key="cat.key" :value="cat.key">{{ cat.label }}</option>
        </select>
      </label>
      <div v-if="fieldErrors.category" :id="errId('category')" :class="errorCls">{{ fieldErrors.category }}</div>
    </div>

    <h3 class="text-[13px] font-semibold mt-1" :class="inkSoftCls">Per 100 g</h3>
    <div>
      <label :class="fieldCls">
        <span :class="labelCls">Calories</span>
        <input v-model="newFood.kcal" inputmode="numeric" placeholder="0" autocomplete="off" :class="fieldInputCls" :aria-invalid="!!fieldErrors.kcal" :aria-describedby="describedBy('kcal')">
      </label>
      <div v-if="fieldErrors.kcal" :id="errId('kcal')" :class="errorCls">{{ fieldErrors.kcal }}</div>
    </div>
    <div class="grid grid-cols-3 gap-2">
      <div v-for="[key, label] in MACRO_FIELDS" :key="key">
        <label :class="fieldCls">
          <span :class="labelCls">{{ label }}</span>
          <input
            v-model="newFood[key]"
            inputmode="decimal"
            placeholder="0"
            autocomplete="off"
            :class="fieldInputCls"
            :aria-invalid="!!fieldErrors[key] || (key === 'f' && sumInvalid)"
            :aria-describedby="describedBy(key) ?? (key === 'f' && sumInvalid ? errId('sum') : undefined)"
          >
        </label>
        <div v-if="fieldErrors[key]" :id="errId(key)" :class="errorCls">{{ fieldErrors[key] }}</div>
      </div>
    </div>
    <div v-if="sumInvalid" :id="errId('sum')" class="-mt-1.5" :class="errorCls">Protein, carbs and fat can't add up to more than 100 g.</div>
    <div>
      <label :class="fieldCls">
        <span :class="labelCls">Fiber (g, optional)</span>
        <input v-model="newFood.fiber" inputmode="decimal" placeholder="—" autocomplete="off" :class="fieldInputCls" :aria-invalid="!!fieldErrors.fiber" :aria-describedby="describedBy('fiber')">
      </label>
      <div v-if="fieldErrors.fiber" :id="errId('fiber')" :class="errorCls">{{ fieldErrors.fiber }}</div>
    </div>

    <fieldset class="flex flex-col gap-2 mt-1">
      <legend class="text-[13px] font-semibold mb-2" :class="inkSoftCls">Portions (optional)</legend>
      <div v-for="(row, i) in newFood.portions" :key="i" class="flex items-center gap-2">
        <label class="flex-1 min-w-0 rounded-xl px-3.5 py-2.5" :class="[ringWithinCls, bgCls]">
          <input
            ref="portionLabels"
            v-model="row.label"
            :aria-label="`Portion ${i + 1} name`"
            placeholder="1 bar"
            autocomplete="off"
            :class="fieldInputCls"
          >
        </label>
        <label class="w-[104px] shrink-0 rounded-xl px-3.5 py-2.5 flex items-center gap-1" :class="[ringWithinCls, bgCls]">
          <input v-model="row.grams" :aria-label="`Portion ${i + 1} grams`" inputmode="decimal" placeholder="0" autocomplete="off" class="w-full min-w-0 text-right" :class="inputTextCls">
          <span class="text-[13px]" :class="inkSoftCls" aria-hidden="true">g</span>
        </label>
        <button
          type="button"
          :aria-label="`Remove portion ${i + 1}`"
          class="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-[17px]"
          :class="[bgCls, inkSoftCls, focusRingCls]"
          @click="removePortion(i)"
        >
          ×
        </button>
      </div>
      <button
        v-if="newFood.portions.length < MAX_PORTIONS"
        type="button"
        class="self-start py-1.5 text-[13.5px] font-semibold rounded"
        :class="[linkBlueCls, focusRingCls]"
        @click="onAddPortion"
      >
        + Add portion
      </button>
      <div v-if="fieldErrors.portions" :class="errorCls" role="alert">{{ fieldErrors.portions }}</div>
    </fieldset>

    <div :class="fieldCls">
      <label class="block text-xs mb-1" :class="inkFaintCls" :for="`${id}-price`">Price (USD, per 100 g)</label>
      <div class="flex items-center gap-1">
        <span aria-hidden="true" :class="inputTextCls">$</span>
        <input
          :id="`${id}-price`"
          v-model="newFood.price"
          inputmode="decimal"
          placeholder="0.00"
          autocomplete="off"
          :class="fieldInputCls"
          :aria-invalid="showPriceError"
          :aria-describedby="showPriceError ? errId('price') : undefined"
          @blur="priceTouched = true"
        >
      </div>
      <div v-if="showPriceError" :id="errId('price')" :class="errorCls">Enter a price like 1.10.</div>
    </div>

    <div class="mt-auto flex flex-col gap-2 pt-1">
      <div v-if="formError" role="alert" class="rounded-xl px-3.5 py-2.5 text-[13px] font-semibold" :class="[ACCENT.coral.track, ACCENT.coral.icon]">{{ formError }}</div>
      <p v-if="missing" :id="missingId" class="text-[13px] text-center" :class="inkFaintCls">{{ missing }}</p>
      <button type="submit" :aria-describedby="missing ? missingId : undefined" :disabled="!parsedFood || creating" class="w-full h-[46px] shrink-0 rounded-full bg-ink text-white dark:bg-white dark:text-black flex items-center justify-center text-[14.5px] font-semibold disabled:opacity-40" :class="focusRingCls">
        {{ creating ? 'Saving…' : submitLabel }}
      </button>
    </div>
  </form>
</template>
