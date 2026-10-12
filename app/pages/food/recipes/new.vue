<script setup lang="ts">
import type { FoodItem } from '~/types/food'

definePageMeta({ tab: 'food' })

const {
  recipe, filteredCatalog, query, pickerMode, saving, canSave, saveHint, totals, perServing,
  refreshCatalog, changeServings, addIngredient, removeIngredient, startCreate, save,
} = useRecipe()

const searchInput = ref<HTMLInputElement>()
const focusSearch = () => nextTick(() => searchInput.value?.focus())
const trimmedQuery = computed(() => query.value.trim())
const resultsId = useId()
const saveHintId = useId()
const removeBtns = ref<HTMLButtonElement[]>([])

/** Keep keyboard focus in the list: next row's ×, else the previous one, else the search. */
async function remove(idx: number) {
  removeIngredient(idx)
  await nextTick()
  const next = removeBtns.value[Math.min(idx, removeBtns.value.length - 1)]
  if (next) next.focus()
  else searchInput.value?.focus()
}

const blurActive = () => (document.activeElement as HTMLElement | null)?.blur()
/**
 * Keep typing after an add with a mouse or the keyboard (click.detail is 0) for quick multi-add.
 * On a touch tap, let go of focus instead so the phone keyboard closes and the Save bar comes back.
 */
const keepTyping = (e?: MouseEvent) => (!!e && e.detail === 0) || matchMedia('(pointer: fine)').matches

function pick(item: FoodItem, e?: MouseEvent) {
  addIngredient(item)
  if (keepTyping(e)) focusSearch()
  else blurActive()
}

async function onCreated(item: FoodItem) {
  pick(item)
  await refreshCatalog()
}

function backToSearch() {
  pickerMode.value = 'list'
  focusSearch()
}

/** Escape steps out one level: create form → search → cleared search. */
function onPickerEscape() {
  if (pickerMode.value === 'create') backToSearch()
  else query.value = ''
}

// Invisible hit-slop so small round buttons still get a ~44px tap area.
const hitSlopCls = 'relative after:absolute after:-inset-1.5 after:content-[\'\']'
const pressCls = 'active:opacity-70 transition-opacity motion-reduce:transition-none'
const stepperBtnCls = ['w-9 h-9 rounded-full flex items-center justify-center text-[17px]', hitSlopCls, pressCls]
const primaryBtnCls = 'bg-ink text-white dark:bg-white dark:text-black'
const saveLabel = computed(() => saving.value ? 'Saving…' : 'Save recipe')
// The pinned mobile bar steps aside while typing or searching so it doesn't sit on the keyboard or cover results.
const typing = ref(false)
const onFocusChange = (e: FocusEvent) => { typing.value = e.type === 'focusin' && e.target instanceof HTMLInputElement }
// Phones also get bottom padding on the page root (pb-24) so the end stays clear of the fixed bar.
const picking = computed(() => typing.value || !!trimmedQuery.value || pickerMode.value === 'create')
</script>

<template>
  <div class="max-w-[1160px] pb-24 md:pb-0">
    <NuxtLink to="/food" class="inline-block py-3 -my-3 mb-1 text-[13.5px] font-semibold rounded" :class="[linkBlueCls, focusRingCls]">← Back to food</NuxtLink>

    <div v-if="recipe" class="grid grid-cols-1 md:grid-cols-[1fr_340px] gap-4 md:gap-6 items-start">
      <!-- Focused controls scroll clear of the pinned mobile Save bar. -->
      <div class="flex flex-col gap-4 min-w-0 [&_button]:scroll-mb-36 [&_input]:scroll-mb-36" @focusin="onFocusChange" @focusout="onFocusChange">
        <div class="rounded-2xl px-5 py-[18px] shadow-xs" :class="cardCls">
          <label for="recipe-name" class="sr-only">Recipe name</label>
          <input
            id="recipe-name"
            v-model="recipe.name"
            placeholder="Name your recipe"
            autocomplete="off"
            class="w-full bg-transparent outline-hidden text-[26px] leading-tight font-bold tracking-tight border-b-2 border-transparent focus:border-ink/60 dark:focus:border-white/60 pb-1 placeholder:text-black/25 dark:placeholder:text-white/25"
            :class="inkCls"
          >
          <div class="mt-3 flex items-center justify-between">
            <span class="text-[14.5px]" :class="inkSoftCls">Makes</span>
            <div class="flex items-center gap-3">
              <button type="button" aria-label="Fewer servings" :class="[stepperBtnCls, bgCls, inkCls, focusRingCls]" @click="changeServings(-1)">–</button>
              <span class="min-w-[86px] text-center text-[15px] font-semibold tabular-nums" :class="inkCls" aria-live="polite">{{ recipe.servings }} {{ recipe.servings === 1 ? 'serving' : 'servings' }}</span>
              <button type="button" aria-label="More servings" :class="[stepperBtnCls, primaryBtnCls, focusRingCls]" @click="changeServings(1)">+</button>
            </div>
          </div>
        </div>

        <section class="rounded-2xl px-5 py-[18px] shadow-xs" :class="cardCls" aria-labelledby="ingredients-heading">
          <div class="flex justify-between items-baseline mb-3">
            <h2 id="ingredients-heading" class="text-[15px] font-bold" :class="inkCls">Ingredients</h2>
            <span class="text-[13px] tabular-nums" :class="inkSoftCls" aria-live="polite">{{ recipe.ingredients.length }} {{ recipe.ingredients.length === 1 ? 'item' : 'items' }}</span>
          </div>

          <ul v-if="recipe.ingredients.length" class="flex flex-col">
            <li v-for="(ing, idx) in recipe.ingredients" :key="idx" class="flex items-center gap-3 py-2.5 border-t first:border-t-0" :class="dividerCls">
              <div class="flex-1 min-w-0">
                <div class="text-[14.5px] font-semibold" :class="inkCls">{{ ing.name }}</div>
                <div class="text-[12.5px]" :class="inkSoftCls">{{ ing.kcal }} kcal · {{ ing.p }}g protein · {{ ing.c }}g carbs</div>
              </div>
              <button ref="removeBtns" type="button" :aria-label="`Remove ${ing.name}`" class="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-[17px]" :class="[bgCls, inkSoftCls, focusRingCls, hitSlopCls, pressCls]" @click="remove(idx)">×</button>
            </li>
          </ul>
          <p v-else class="text-[13.5px] py-1" :class="inkSoftCls">Add the first ingredient below.</p>

          <div class="mt-3 pt-3 border-t" :class="dividerCls" @keydown.esc="onPickerEscape">
            <template v-if="pickerMode === 'list'">
              <label class="rounded-xl px-3.5 py-2.5 flex items-center gap-2 focus-within:ring-2 focus-within:ring-ink/40 dark:focus-within:ring-white/50" :class="bgCls">
                <AppIcon :path="ICONS.search" class="w-[15px] h-[15px]" :class="inkFaintCls" />
                <input
                  ref="searchInput"
                  v-model="query"
                  type="search"
                  placeholder="Add an ingredient"
                  aria-label="Add an ingredient"
                  :aria-controls="resultsId"
                  autocomplete="off"
                  class="flex-1 min-w-0 bg-transparent outline-hidden text-base sm:text-[14.5px] placeholder:text-black/40 dark:placeholder:text-white/40"
                  :class="inkCls"
                >
              </label>
              <div v-if="trimmedQuery" :id="resultsId" class="flex flex-col gap-1.5 mt-2">
                <button
                  v-for="item in filteredCatalog"
                  :key="item.id"
                  type="button"
                  class="rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3 text-left"
                  :class="[bgCls, focusRingCls, pressCls]"
                  @click="pick(item, $event)"
                >
                  <div class="min-w-0">
                    <div class="text-sm font-semibold" :class="inkCls">{{ item.name }}</div>
                    <div class="text-[12px]" :class="inkSoftCls"><template v-if="item.brand === 'My food'">My food · </template>{{ item.serving }} · {{ item.kcal }} kcal · {{ item.p }}g protein · {{ item.c }}g carbs</div>
                  </div>
                  <span class="text-base shrink-0" :class="linkBlueCls" aria-hidden="true">+</span>
                </button>
                <div role="status" class="text-[13.5px] text-center empty:hidden" :class="inkSoftCls"><template v-if="!filteredCatalog.length">No match for “{{ trimmedQuery }}”.</template></div>
                <button type="button" class="border-[1.5px] border-dashed border-accent-blue/40 rounded-xl px-3.5 py-2.5 text-[13.5px] font-semibold" :class="[linkBlueCls, focusRingCls]" @click="startCreate">
                  + Create “{{ trimmedQuery }}”
                </button>
              </div>
            </template>

            <div v-else class="flex flex-col gap-3">
              <div class="flex justify-between items-center">
                <span class="text-[15px] font-bold" :class="inkCls">New ingredient</span>
                <button type="button" class="text-[13.5px] font-semibold rounded" :class="[linkBlueCls, focusRingCls]" @click="backToSearch">Back to search</button>
              </div>
              <AppIngredientForm :initial-name="trimmedQuery" submit-label="Add to recipe" @created="onCreated" />
            </div>
          </div>
        </section>
      </div>

      <!-- On phones the pinned bar below carries the per-serving summary instead. -->
      <aside class="hidden md:flex flex-col gap-3 md:sticky md:top-0">
        <div class="bg-ink rounded-2xl p-5 flex flex-col gap-3">
          <div class="text-[13px] font-semibold text-white/60">Per serving</div>
          <div class="flex justify-between items-baseline"><span class="text-[13.5px] text-white/60">Calories</span><span data-testid="per-serving-kcal" class="text-2xl font-bold text-white tabular-nums">{{ perServing.kcal }} kcal</span></div>
          <div class="flex justify-between"><span class="text-[13.5px] text-white/60">Protein</span><span class="text-[14.5px] font-semibold text-white tabular-nums">{{ perServing.p }}g</span></div>
          <div class="flex justify-between"><span class="text-[13.5px] text-white/60">Carbs</span><span class="text-[14.5px] font-semibold text-white tabular-nums">{{ perServing.c }}g</span></div>
          <div v-if="recipe.servings > 1" class="text-[12.5px] text-white/50 pt-1 border-t border-white/10">Whole recipe: {{ Math.round(totals.kcal) }} kcal</div>
        </div>
        <button type="button" :disabled="!canSave || saving" :aria-describedby="saveHint ? saveHintId : undefined" class="flex w-full h-[50px] rounded-full items-center justify-center text-[15px] font-semibold disabled:opacity-50" :class="[primaryBtnCls, focusRingCls, pressCls]" @click="save">{{ saveLabel }}</button>
        <p v-if="saveHint" :id="saveHintId" class="text-[13px] text-center" :class="inkSoftCls">{{ saveHint }}</p>
      </aside>

      <div v-if="!picking" class="md:hidden fixed inset-x-4 bottom-[calc(76px+env(safe-area-inset-bottom))] z-20 rounded-[28px] pl-5 pr-2 py-2 flex items-center justify-between gap-3 shadow-lg ring-1 ring-black/5 dark:ring-white/15" :class="cardCls">
        <span v-if="saveHint" :id="`${saveHintId}-bar`" class="text-[13px] leading-snug" :class="inkSoftCls">{{ saveHint }}</span>
        <div v-else class="min-w-0 text-[13px] leading-snug tabular-nums" :class="inkSoftCls">
          <div><span data-testid="per-serving-kcal" class="text-[15px] font-bold" :class="inkCls">{{ perServing.kcal }} kcal</span> per serving</div>
          <div>{{ perServing.p }}g protein · {{ perServing.c }}g carbs</div>
        </div>
        <button type="button" :disabled="!canSave || saving" :aria-describedby="saveHint ? `${saveHintId}-bar` : undefined" class="h-11 px-5 shrink-0 rounded-full text-[14.5px] font-semibold disabled:opacity-50" :class="[primaryBtnCls, focusRingCls, pressCls]" @click="save">{{ saveLabel }}</button>
      </div>
    </div>
  </div>
</template>
