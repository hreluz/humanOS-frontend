<script setup lang="ts">
import type { RouteLocationNormalized } from 'vue-router'

definePageMeta({ tab: 'log' })

const {
  tab, search, saving, kg,
  now, at, days, isNow, isToday, whenDay, whenTime, resetWhen,
  basket, meal, inBasket, toggleFood, stepFood, setFoodAmount,
  recipeAmount, isEdited, setIngredientAmount, stepIngredient, removeIngredient, removedIngredients, restoreIngredient, resetIngredients,
  activityQuery, activityResults, activity, activityAmount, selectActivity, stepActivity,
  estimatedKcal, kcalOverride, kcalModel, stepKcal, resetKcal,
  waterMl, stepWater,
  impact, canSubmit, submitLabel, submit, hasApproved, leave,
} = useQuickLog()
const { query, tab: foodTab, results } = search
const { tabindex, onKeydown } = useRadioGroup(QUICK_LOG_TABS.map(t => t.key), tab)

const searchBoxCls = ['rounded-xl px-3.5 py-2.5 flex items-center gap-2', bgCls]
const searchInputCls = ['flex-1 min-w-0 bg-transparent outline-hidden text-[14.5px] placeholder:text-black/30 dark:placeholder:text-white/30', inkCls]
const otherDay = computed(() => {
  const label = formatDayLabel(at.value, now.value)
  return label === 'Yesterday' ? 'yesterday' : label
})
// The recipe whose ingredients are being edited; it takes over the whole sheet so the list gets room, phones included.
const editingId = ref<string | null>(null)
const editing = computed(() => basket.value.find(b => b.item.id === editingId.value && b.ingredients) ?? null)
const backBtn = ref<HTMLButtonElement>()
const editBtns = ref<HTMLButtonElement[]>([])

async function editIngredients(id: string) {
  editingId.value = id
  await nextTick()
  backBtn.value?.focus()
}

/** Back to the basket, with focus on the recipe's Edit button. */
async function doneEditing() {
  const id = editingId.value
  editingId.value = null
  await nextTick()
  // Bring the whole row back into view, not just the button, so the recipe's name shows above it.
  const btn = editBtns.value.find(b => b.dataset.id === id)
  btn?.focus({ preventScroll: true })
  btn?.closest('[data-entry]')?.scrollIntoView({ block: 'nearest' })
}

// Leaving with something picked but not logged asks first. In-page markup, never a browser dialog.
const route = useRoute()
const router = useRouter()
const confirming = ref(false)
const confirmId = useId()
const confirmEl = ref<HTMLElement>()
const keepBtn = ref<HTMLButtonElement>()
let stopped: RouteLocationNormalized | null = null
let discarding = false
let returnFocus: HTMLElement | null = null

onBeforeRouteLeave((to) => {
  // Tab switches only change the query; they never ask.
  if (discarding || !hasApproved.value || to.path === route.path) return true
  stopped = to
  returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  confirming.value = true
  nextTick(() => keepBtn.value?.focus())
  return false
})

function keepEditing() {
  confirming.value = false
  stopped = null
  nextTick(() => returnFocus?.focus())
}

/** Repeats the navigation that was stopped, with the guard off. */
function discard() {
  const to = stopped
  confirming.value = false
  if (!to) return
  discarding = true
  // A stopped Back (browser or X) goes back again rather than adding a history entry.
  if (window.history.state?.back === to.fullPath) router.back()
  else navigateTo(to.fullPath)
}

/** Tab and Shift+Tab cycle between the dialog's buttons. */
function trapFocus(e: KeyboardEvent) {
  if (e.key !== 'Tab' || !confirmEl.value) return
  const btns = [...confirmEl.value.querySelectorAll('button')]
  const i = btns.indexOf(document.activeElement as HTMLButtonElement)
  e.preventDefault()
  btns[(i + (e.shiftKey ? -1 : 1) + btns.length) % btns.length]?.focus()
}

// Escape: the dialog keeps editing, the recipe editor steps back to the basket, otherwise the page closes.
// A modal opened on top (e.g. the coach) handles its own Escape.
const { isOpen: modalOpen } = useModal()
function onWindowKeydown(e: KeyboardEvent) {
  if (e.key !== 'Escape' || modalOpen.value) return
  if (confirming.value) keepEditing()
  else if (editing.value) doneEditing()
  else leave()
}
onMounted(() => window.addEventListener('keydown', onWindowKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onWindowKeydown))

// Invisible hit-slop so small round buttons still get a ~44px tap area.
const hitSlopCls = 'relative after:absolute after:-inset-1.5 after:content-[\'\']'
const rowCls = (on: boolean) => ['w-full rounded-2xl px-3.5 py-3 flex items-center gap-3 text-left border-2', focusRingCls, on ? 'border-ink dark:border-white' : 'border-transparent', bgCls]
</script>

<template>
  <div class="h-full w-full md:max-w-[560px] mx-auto">
    <!-- Fills the main column; the list scrolls and the bottom bar stays pinned (above the tab bar on phones). -->
    <div class="h-full min-h-[480px] rounded-2xl shadow-xs flex flex-col overflow-hidden" :class="cardCls">
      <!-- Editing a recipe's ingredients: just this recipe, with the whole sheet to work in -->
      <template v-if="editing">
        <div class="px-3 pt-4 pb-3 flex items-center gap-1 border-b" :class="dividerCls">
          <button
            ref="backBtn"
            type="button"
            aria-label="Back to your list"
            class="w-11 h-11 shrink-0 rounded-full flex items-center justify-center"
            :class="[inkCls, focusRingCls]"
            @click="doneEditing"
          >
            <AppIcon :path="ICONS.chevronRight" class="w-5 h-5 rotate-180" />
          </button>
          <div class="flex-1 min-w-0">
            <h2 class="text-[17px] font-bold truncate" :class="inkCls">{{ editing.item.name }}</h2>
            <p class="text-xs" :class="inkFaintCls">Changes count for this log only.</p>
          </div>
        </div>

        <div class="flex-1 overflow-auto px-5 py-4 flex flex-col gap-5">
          <div class="flex items-center gap-3">
            <div class="flex-1 text-[14.5px] font-semibold" :class="inkCls">Servings eaten</div>
            <AppStepper
              :model-value="editing.amount"
              :unit="portionUnit(editing.item, editing.amount)"
              :label="editing.item.name"
              integer
              :max="AMOUNT_LIMITS.serving"
              @update:model-value="n => setFoodAmount(editing!.item.id, n)"
              @step="dir => stepFood(editing!.item.id, dir)"
            />
          </div>

          <section aria-labelledby="ingredients-heading" class="flex flex-col">
            <h3 id="ingredients-heading" class="text-[13px] font-semibold mb-1" :class="inkSoftCls">Ingredients</h3>
            <ul class="flex flex-col">
              <li v-for="ing in editing.ingredients" :key="ing.item.id" class="flex items-center gap-2.5 py-3 border-t first:border-t-0" :class="dividerCls">
                <div class="flex-1 min-w-0">
                  <div class="text-[14.5px] font-semibold truncate" :class="inkCls">{{ ing.item.name }}</div>
                  <div class="text-xs tabular-nums" :class="inkFaintCls">
                    {{ scaleFood(ing.item, ing.amount).kcal }} kcal
                    <template v-if="formatAmountChange(ing.item, recipeAmount(editing, ing.item.id) ?? 0, ing.amount)">
                      · <span :class="inkSoftCls">{{ formatAmountChange(ing.item, recipeAmount(editing, ing.item.id) ?? 0, ing.amount) }}</span>
                    </template>
                  </div>
                </div>
                <AppStepper
                  :model-value="ing.amount"
                  :unit="portionUnit(ing.item, ing.amount)"
                  :label="ing.item.name"
                  :max="AMOUNT_LIMITS[ing.item.unit]"
                  @update:model-value="n => setIngredientAmount(editing!.item.id, ing.item.id, n)"
                  @step="dir => stepIngredient(editing!.item.id, ing.item.id, dir)"
                />
                <button
                  type="button"
                  :aria-label="`Remove ${ing.item.name}`"
                  class="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-[17px]"
                  :class="[bgCls, inkSoftCls, focusRingCls, hitSlopCls]"
                  @click="removeIngredient(editing!.item.id, ing.item.id)"
                >
                  ×
                </button>
              </li>
            </ul>
            <p v-if="!editing.ingredients!.length" class="text-[13.5px] py-2" :class="inkSoftCls">Everything is removed. Add something back to log this recipe.</p>
          </section>

          <section v-if="removedIngredients(editing).length" aria-labelledby="removed-heading" class="flex flex-col">
            <h3 id="removed-heading" class="text-[13px] font-semibold mb-1" :class="inkSoftCls">Left out</h3>
            <ul class="flex flex-col">
              <li v-for="ing in removedIngredients(editing)" :key="ing.item.id" class="flex items-center gap-3 py-2.5 border-t first:border-t-0" :class="dividerCls">
                <div class="flex-1 min-w-0 text-[14.5px] truncate line-through decoration-1" :class="inkFaintCls">{{ ing.item.name }}, {{ formatPortion(ing.item, ing.amount) }}</div>
                <button
                  type="button"
                  :aria-label="`Add back ${ing.item.name}`"
                  class="min-h-11 px-2 -mr-2 text-[13.5px] font-semibold rounded-lg"
                  :class="[linkBlueCls, focusRingCls]"
                  @click="restoreIngredient(editing!.item.id, ing.item.id)"
                >
                  Add back
                </button>
              </li>
            </ul>
          </section>

          <div v-if="isEdited(editing)" class="text-[13px]" :class="inkFaintCls">
            Changed from the recipe.
            <button type="button" class="font-semibold rounded py-2 -my-2" :class="[linkBlueCls, focusRingCls]" @click="resetIngredients(editing.item.id)">Use recipe</button>
          </div>
        </div>

        <div class="shrink-0 border-t px-5 pt-3 pb-5 flex items-center gap-4" :class="dividerCls">
          <div class="flex-1 min-w-0 tabular-nums" aria-live="polite">
            <div class="text-[15px] font-bold" :class="inkCls">{{ entryMacros(editing).kcal }} kcal</div>
            <div class="text-xs" :class="inkFaintCls">{{ entryMacros(editing).p }}g protein · {{ entryMacros(editing).c }}g carbs</div>
          </div>
          <button
            type="button"
            class="h-[50px] px-8 rounded-full bg-ink text-white dark:bg-white dark:text-black text-[15px] font-semibold"
            :class="focusRingCls"
            @click="doneEditing"
          >
            Done
          </button>
        </div>
      </template>

      <template v-else>
        <div class="px-5 pt-5 pb-4 flex items-center gap-3">
          <div class="flex-1 grid grid-cols-3 gap-1 p-1 rounded-xl" :class="bgCls" role="radiogroup" aria-label="What to log" @keydown="onKeydown">
            <button
              v-for="t in QUICK_LOG_TABS"
              :key="t.key"
              type="button"
              role="radio"
              :aria-checked="tab === t.key"
              :tabindex="tabindex(t.key)"
              :class="[segmentCls, focusRingCls, tab === t.key ? segmentOnCls : inkSoftCls]"
              @click="tab = t.key"
            >
              {{ t.label }}
            </button>
          </div>
          <button
            type="button"
            aria-label="Close"
            class="w-11 h-11 -mr-2 shrink-0 rounded-full flex items-center justify-center"
            :class="[inkSoftCls, focusRingCls]"
            @click="leave"
          >
            <AppIcon :path="ICONS.close" class="w-5 h-5" />
          </button>
        </div>

        <!-- Food: search the catalog, tap + on everything eaten -->
        <template v-if="tab === 'food'">
          <div class="px-5">
            <label :class="searchBoxCls">
              <AppIcon :path="ICONS.search" class="w-[15px] h-[15px]" :class="inkFaintCls" />
              <input v-model="query" type="search" placeholder="Search foods" aria-label="Search foods" :class="searchInputCls">
            </label>
          </div>
          <div class="px-5 pt-3 flex gap-2">
            <button
              v-for="t in FOOD_SEARCH_TABS"
              :key="t.key"
              type="button"
              class="px-3 py-1.5 rounded-[10px] text-[12.5px] font-semibold"
              :class="foodTab === t.key ? segmentOnCls : inkSoftCls"
              @click="foodTab = t.key"
            >
              {{ t.label }}
            </button>
          </div>
          <div class="flex-1 overflow-auto px-5 pb-4 pt-3 flex flex-col gap-2">
            <div v-for="food in results ?? []" :key="food.id" :class="rowCls(inBasket(food.id))">
              <div class="flex-1 min-w-0">
                <div class="text-[14.5px] font-semibold" :class="inkCls">{{ food.name }}</div>
                <div class="text-xs" :class="inkFaintCls">{{ food.brand }} · {{ food.serving }} · {{ food.kcal }} kcal</div>
              </div>
              <button
                type="button"
                :aria-label="`Add ${food.name}`"
                :aria-pressed="inBasket(food.id)"
                class="w-7 h-7 rounded-full flex items-center justify-center text-base shrink-0"
                :class="[focusRingCls, inBasket(food.id) ? 'bg-accent-green dark:bg-accent-green-dark text-white' : 'bg-ink text-white dark:bg-white dark:text-black']"
                @click="toggleFood(food)"
              >
                <AppIcon v-if="inBasket(food.id)" :path="ICONS.check" class="w-3.5 h-3.5" />
                <template v-else>+</template>
              </button>
            </div>
            <div v-if="results && !results.length" class="text-[13.5px] py-6 text-center" :class="inkFaintCls">No foods match “{{ query }}”</div>
          </div>
        </template>

        <!-- Activity: one activity, minutes or steps -->
        <template v-else-if="tab === 'activity'">
          <div class="px-5">
            <label :class="searchBoxCls">
              <AppIcon :path="ICONS.search" class="w-[15px] h-[15px]" :class="inkFaintCls" />
              <input v-model="activityQuery" type="search" placeholder="Search activities" aria-label="Search activities" :class="searchInputCls">
            </label>
          </div>
          <div class="flex-1 overflow-auto px-5 pb-4 pt-3 flex flex-col gap-2" role="radiogroup" aria-label="Activity">
            <button
              v-for="a in activityResults"
              :key="a.key"
              type="button"
              role="radio"
              :aria-checked="activity?.key === a.key"
              :class="rowCls(activity?.key === a.key)"
              @click="selectActivity(a.key)"
            >
              <div class="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0" :class="ACCENT.green.iconBg">
                <AppIcon :path="a.icon" class="w-[17px] h-[17px]" :class="ACCENT.green.icon" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-[14.5px] font-semibold" :class="inkCls">{{ a.label }}</div>
                <div class="text-xs" :class="inkFaintCls">About {{ burnedKcal(a, a.defaultAmount, kg) }} kcal per {{ formatActivityAmount(a.unit, a.defaultAmount) }}</div>
              </div>
            </button>
            <div v-if="!activityResults.length" class="text-[13.5px] py-6 text-center" :class="inkFaintCls">No activities match “{{ activityQuery }}”</div>
          </div>
        </template>

        <!-- Water: a glass, a bottle, or anything in between -->
        <div v-else class="flex-1 overflow-auto px-5 pb-4 flex flex-col items-center justify-center gap-6">
          <div class="flex gap-2.5" role="radiogroup" aria-label="Amount">
            <button
              v-for="ml in WATER_PRESETS"
              :key="ml"
              type="button"
              role="radio"
              :aria-checked="waterMl === ml"
              class="w-[88px] h-[88px] rounded-2xl flex flex-col items-center justify-center gap-1.5 border-2"
              :class="[bgCls, focusRingCls, waterMl === ml ? 'border-ink dark:border-white' : 'border-transparent']"
              @click="waterMl = ml"
            >
              <AppIcon :path="ICONS.water" class="w-5 h-5" :class="ACCENT.blue.icon" />
              <span class="text-[13.5px] font-semibold" :class="inkCls">{{ ml }} ml</span>
            </button>
          </div>
          <AppStepper v-model="waterMl" unit="ml" label="Water" integer :max="AMOUNT_LIMITS.ml" @step="stepWater" />
        </div>

        <!-- Pinned: amounts, the goals this moves, and the action -->
        <div class="shrink-0 border-t px-5 pt-4 pb-5 flex flex-col gap-4" :class="dividerCls">
          <!-- On phones the details scroll so the list above keeps its room; the action stays put. -->
          <div class="flex flex-col gap-4 max-h-[30vh] md:max-h-none overflow-auto -m-1 p-1">
            <template v-if="tab === 'food'">
              <div v-if="basket.length" class="flex flex-col gap-2 md:max-h-[140px] md:overflow-auto -m-1 p-1">
                <div v-for="b in basket" :key="b.item.id" data-entry>
                  <div class="flex items-center gap-3">
                    <div class="flex-1 min-w-0">
                      <div class="text-[14px] font-semibold truncate" :class="inkCls">{{ b.item.name }}</div>
                      <div class="text-xs" :class="inkFaintCls">{{ entryMacros(b).kcal }} kcal · {{ entryMacros(b).p }}g protein</div>
                    </div>
                    <AppStepper
                      :model-value="b.amount"
                      :unit="portionUnit(b.item, b.amount)"
                      :label="b.item.name"
                      :integer="b.item.unit === 'piece' || b.item.unit === 'serving'"
                      :max="AMOUNT_LIMITS[b.item.unit]"
                      @update:model-value="n => setFoodAmount(b.item.id, n)"
                      @step="dir => stepFood(b.item.id, dir)"
                    />
                  </div>
                  <div v-if="b.ingredients" class="mt-0.5 flex items-center gap-2 text-xs">
                    <span v-if="isEdited(b)" :class="inkFaintCls">Ingredients changed</span>
                    <button
                      ref="editBtns"
                      type="button"
                      :data-id="b.item.id"
                      :aria-label="`Edit ingredients of ${b.item.name}`"
                      class="py-1.5 font-semibold rounded"
                      :class="[linkBlueCls, focusRingCls, hitSlopCls]"
                      @click="editIngredients(b.item.id)"
                    >
                      {{ isEdited(b) ? 'Edit' : 'Edit ingredients' }}
                    </button>
                  </div>
                </div>
              </div>
              <div v-if="basket.length" class="grid grid-cols-4 gap-1 p-1 rounded-xl" :class="bgCls" role="radiogroup" aria-label="Meal">
                <button
                  v-for="m in MEAL_OPTIONS"
                  :key="m.key"
                  type="button"
                  role="radio"
                  :aria-checked="meal === m.key"
                  class="min-h-9 rounded-lg text-[12.5px] font-semibold"
                  :class="[focusRingCls, meal === m.key ? segmentOnCls : inkSoftCls]"
                  @click="meal = m.key"
                >
                  {{ m.label }}
                </button>
              </div>
              <div v-else class="text-[13.5px]" :class="inkFaintCls">Tap + on everything you ate, then set the amounts here.</div>
            </template>

            <template v-else-if="tab === 'activity'">
              <div v-if="activity" class="flex flex-col gap-2.5">
                <div class="flex items-center gap-3">
                  <div class="flex-1 min-w-0 text-[14px] font-semibold" :class="inkCls">{{ activity.label }}</div>
                  <AppStepper v-model="activityAmount" :unit="activity.unit" :label="activity.label" integer :max="AMOUNT_LIMITS[activity.unit]" @step="stepActivity" />
                </div>
                <div class="flex items-center gap-3">
                  <div class="flex-1 min-w-0">
                    <div class="text-[14px] font-semibold" :class="inkCls">Calories burned</div>
                    <div class="text-xs" :class="inkFaintCls">
                      <template v-if="kcalOverride === null">Estimated from your weight, {{ Math.round(kg * 10) / 10 }} kg</template>
                      <template v-else>
                        Changed from the {{ estimatedKcal }} kcal estimate.
                        <button type="button" class="font-semibold" :class="[linkBlueCls, focusRingCls]" @click="resetKcal">Use estimate</button>
                      </template>
                    </div>
                  </div>
                  <AppStepper v-model="kcalModel" unit="kcal" label="Calories burned" integer :max="AMOUNT_LIMITS.kcal" @step="stepKcal" />
                </div>
              </div>
              <div v-else class="text-[13.5px]" :class="inkFaintCls">Pick what you did, then set how long or how many steps.</div>
            </template>

            <AppLogTime v-model:day="whenDay" v-model:time="whenTime" :days="days" :now="now" :at="at" :is-now="isNow" @reset="resetWhen" />

            <div v-if="!isToday" class="text-[13px]" :class="inkSoftCls">This counts for {{ otherDay }}, so today's goals don't change.</div>
            <section v-else-if="impact.length" aria-label="Moves your goals" class="flex flex-col gap-3">
              <div class="text-[13px] font-semibold" :class="inkSoftCls">Moves your goals</div>
              <div v-for="row in impact" :key="row.id">
                <div class="flex justify-between gap-3 text-[13px] mb-1.5">
                  <span class="font-semibold" :class="inkCls">{{ row.label }}</span>
                  <span class="tabular-nums" :class="inkSoftCls">{{ row.change }}</span>
                </div>
                <AppProgressBar :pct="row.pct" :add-pct="row.addPct" :accent="row.accent" />
              </div>
            </section>
          </div>

          <button
            type="button"
            :disabled="!canSubmit"
            class="w-full h-[50px] rounded-full bg-ink text-white dark:bg-white dark:text-black flex items-center justify-center text-[15px] font-semibold disabled:opacity-40"
            :class="focusRingCls"
            @click="submit"
          >
            {{ saving ? 'Logging…' : submitLabel }}
          </button>
        </div>
      </template>
    </div>

    <!-- Asked before leaving with an unlogged basket or activity -->
    <div v-if="confirming" class="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4" @click.self="keepEditing">
      <div
        ref="confirmEl"
        role="alertdialog"
        aria-modal="true"
        :aria-labelledby="confirmId"
        class="w-full max-w-[360px] rounded-2xl p-5 shadow-2xl flex flex-col gap-5"
        :class="cardCls"
        @keydown="trapFocus"
      >
        <p :id="confirmId" class="text-[16px] font-bold" :class="inkCls">Discard what you haven't logged?</p>
        <div class="flex justify-end gap-2">
          <button
            type="button"
            class="h-11 px-4 rounded-full text-[14px] font-semibold"
            :class="[ACCENT.coral.icon, focusRingCls]"
            @click="discard"
          >
            Discard
          </button>
          <button
            ref="keepBtn"
            type="button"
            class="h-11 px-5 rounded-full bg-ink text-white dark:bg-white dark:text-black text-[14px] font-semibold"
            :class="focusRingCls"
            @click="keepEditing"
          >
            Keep editing
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
