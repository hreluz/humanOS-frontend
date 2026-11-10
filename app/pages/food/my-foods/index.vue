<script setup lang="ts">
import type { FoodItem } from '~/types/food'

definePageMeta({ tab: 'food' })

const { current, open } = useModal()
const {
  foods, loading, failed, retry, hasMore, loadingMore, loadMoreFailed, loadMore, filter, filtered, deletingId, refresh, remove,
} = useMyFoods()

const count = computed(() => `${filtered.value.length} ${filtered.value.length === 1 ? 'food' : 'foods'}`)
const emptyFilterText = computed(() => {
  const f = filter.value
  return f === 'all' ? '' : `No foods in ${categoryLabel(f)}.`
})

/** "Eggs · 100 g · 155 kcal · 1 portion · $1.20", all per 100 g. */
function rowMeta(food: FoodItem) {
  const n = food.portions.length
  return [
    food.category && categoryLabel(food.category), '100 g', `${Math.round(food.kcal)} kcal`,
    n && `${n} ${n === 1 ? 'portion' : 'portions'}`, food.price !== undefined && formatPrice(food.price),
  ].filter(Boolean).join(' · ')
}

// The New ingredient modal saves straight to the service; reload once it closes.
watch(current, (key, prev) => {
  if (prev === 'ingredient' && key === null) refresh()
})

// One row at a time asks "Delete {name}?" in place of its actions.
const confirmingId = ref<string | null>(null)
const deleteBtns = new Map<string, HTMLButtonElement>()
// Inside v-for a template ref collects an array; only the confirming row has a Cancel.
const cancelBtns = ref<HTMLButtonElement[]>([])
const filterSelect = ref<HTMLSelectElement>()

async function askDelete(id: string) {
  if (deletingId.value) return
  confirmingId.value = id
  await nextTick()
  cancelBtns.value[0]?.focus()
}

async function cancelDelete() {
  const id = confirmingId.value
  if (!id || deletingId.value) return
  confirmingId.value = null
  await nextTick()
  deleteBtns.get(id)?.focus()
}

// The food whose delete failed; its row says so until the next try.
const deleteFailedId = ref<string | null>(null)

/** Keep keyboard focus in the list: next row's Delete, else the previous one, else the filter. */
async function confirmDelete(id: string) {
  const idx = filtered.value.findIndex(f => f.id === id)
  deleteFailedId.value = null
  try {
    await remove(id)
  }
  catch {
    // The row stays; the confirm closes and the row explains what happened.
    deleteFailedId.value = id
    confirmingId.value = null
    await nextTick()
    deleteBtns.get(id)?.focus()
    return
  }
  confirmingId.value = null
  await nextTick()
  const next = filtered.value[idx] ?? filtered.value[idx - 1]
  if (next) deleteBtns.get(next.id)?.focus()
  else filterSelect.value?.focus()
}

const ringWithinCls = 'focus-within:ring-2 focus-within:ring-ink/40 dark:focus-within:ring-white/50'
const btnCls = ['px-3.5 py-2 rounded-[10px] text-[13px] font-semibold shadow-xs', cardCls, inkCls, focusRingCls]
</script>

<template>
  <div class="max-w-[760px] flex flex-col gap-3.5">
    <NuxtLink to="/food" class="self-start inline-block py-3 -my-3 text-[13.5px] font-semibold rounded" :class="[linkBlueCls, focusRingCls]">← Food</NuxtLink>

    <div class="flex justify-between items-center gap-3">
      <h1 class="text-[20px] font-bold" :class="inkCls">My foods</h1>
      <button type="button" :class="btnCls" @click="open('ingredient')">New ingredient</button>
    </div>

    <div v-if="!foods && loading" class="rounded-2xl px-5 py-8 shadow-xs text-center text-[14.5px]" :class="[cardCls, inkSoftCls]">Loading your foods…</div>
    <div v-else-if="!foods && failed" role="alert" class="rounded-2xl px-5 py-8 shadow-xs flex flex-col items-center gap-3" :class="cardCls">
      <p class="text-[14.5px]" :class="inkSoftCls">Couldn't load your foods.</p>
      <button type="button" class="px-4 py-2 rounded-full bg-ink text-white dark:bg-white dark:text-black text-[13.5px] font-semibold" :class="focusRingCls" @click="retry">Retry</button>
    </div>
    <template v-else-if="foods">
      <template v-if="foods.length">
        <div class="flex items-end gap-3">
          <!-- Same field as the form's Category select; the card colour keeps it visible on the page background. -->
          <label class="block flex-1 rounded-xl px-3.5 py-2.5 shadow-xs" :class="[ringWithinCls, cardCls]">
            <span class="block text-xs mb-1" :class="inkFaintCls">Category</span>
            <select ref="filterSelect" v-model="filter" class="w-full bg-transparent outline-hidden text-base sm:text-[15px] font-semibold dark:[color-scheme:dark]" :class="inkCls">
              <option value="all">All categories</option>
              <option v-for="cat in CATEGORIES" :key="cat.key" :value="cat.key">{{ cat.label }}</option>
            </select>
          </label>
          <span class="pb-3 text-[13px] whitespace-nowrap" :class="inkFaintCls" aria-live="polite">{{ count }}</span>
        </div>

        <section v-if="filtered.length" class="rounded-2xl px-5 py-2 shadow-xs" :class="cardCls">
          <ul>
            <li
              v-for="(food, i) in filtered"
              :key="food.id"
              class="py-3 flex flex-wrap items-center gap-x-3 gap-y-2"
              :class="i > 0 && ['border-t', dividerCls]"
              @keydown.esc="confirmingId === food.id && cancelDelete()"
            >
              <AppFoodThumb :food="food" />
              <div class="min-w-0 flex-1">
                <div class="text-[14.5px] font-semibold truncate" :class="inkCls">{{ food.name }}</div>
                <div class="text-xs" :class="inkFaintCls">{{ rowMeta(food) }}</div>
                <div v-if="deleteFailedId === food.id" role="alert" class="text-xs mt-0.5 text-accent-coral dark:text-accent-coral-dark">Couldn't delete {{ food.name }}.</div>
              </div>
              <!-- Wraps under the name on phones so a long name keeps its line. -->
              <div v-if="confirmingId === food.id" class="basis-full sm:basis-auto flex items-center justify-end gap-2" role="group" :aria-label="`Delete ${food.name}?`">
                <span class="mr-auto sm:mr-1 text-[13px] font-semibold" :class="inkCls">Delete {{ food.name }}?</span>
                <button ref="cancelBtns" type="button" class="px-3 py-1.5 rounded-full border text-[13px] font-semibold disabled:opacity-40" :class="[dividerCls, inkCls, focusRingCls]" :disabled="deletingId === food.id" @click="cancelDelete">Cancel</button>
                <button type="button" class="px-3 py-1.5 rounded-full text-white text-[13px] font-semibold disabled:opacity-60" :class="[ACCENT.coral.bar, focusRingCls]" :disabled="deletingId === food.id" @click="confirmDelete(food.id)">
                  {{ deletingId === food.id ? 'Deleting…' : 'Delete' }}
                </button>
              </div>
              <div v-else class="flex items-center gap-1">
                <NuxtLink
                  :to="`/food/my-foods/${food.id}`"
                  class="px-3 py-1.5 rounded-full text-[13px] font-semibold"
                  :class="[linkBlueCls, focusRingCls]"
                  :aria-label="`Edit ${food.name}`"
                >
                  Edit
                </NuxtLink>
                <button
                  :ref="el => el ? deleteBtns.set(food.id, el as HTMLButtonElement) : deleteBtns.delete(food.id)"
                  type="button"
                  class="px-3 py-1.5 rounded-full text-[13px] font-semibold"
                  :class="[ACCENT.coral.icon, focusRingCls]"
                  :aria-label="`Delete ${food.name}`"
                  @click="askDelete(food.id)"
                >
                  Delete
                </button>
              </div>
            </li>
          </ul>
        </section>
        <div v-else class="rounded-2xl px-5 py-8 shadow-xs flex flex-col items-center gap-3" :class="cardCls">
          <p class="text-[14.5px]" :class="inkSoftCls">{{ emptyFilterText }}</p>
          <button type="button" class="px-4 py-2 rounded-full border text-[13.5px] font-semibold" :class="[dividerCls, inkCls, focusRingCls]" @click="filter = 'all'">Show all</button>
        </div>

        <div v-if="hasMore && loadMoreFailed" class="flex flex-wrap items-center gap-x-3 gap-y-2" role="alert">
          <span class="text-[13.5px]" :class="inkSoftCls">Couldn't load more foods.</span>
          <button
            type="button"
            class="min-h-11 sm:min-h-8 px-3.5 rounded-[10px] text-[13px] font-semibold bg-ink text-white dark:bg-white dark:text-black"
            :class="focusRingCls"
            @click="loadMore"
          >
            Retry
          </button>
        </div>
        <button
          v-else-if="hasMore"
          type="button"
          class="min-h-11 sm:min-h-9 px-3.5 rounded-[10px] text-[13px] font-semibold self-start border disabled:opacity-50"
          :class="[dividerCls, inkCls, focusRingCls]"
          :disabled="loadingMore"
          @click="loadMore"
        >
          {{ loadingMore ? 'Loading…' : 'Load more' }}
        </button>
      </template>

      <div v-else class="rounded-2xl px-5 py-8 shadow-xs flex flex-col items-center gap-3" :class="cardCls">
        <p class="text-[14.5px]" :class="inkSoftCls">No custom foods yet.</p>
        <button type="button" class="px-4 py-2 rounded-full bg-ink text-white dark:bg-white dark:text-black text-[13.5px] font-semibold" :class="focusRingCls" @click="open('ingredient')">New ingredient</button>
      </div>
    </template>
  </div>
</template>
