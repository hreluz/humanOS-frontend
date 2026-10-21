<script setup lang="ts">
definePageMeta({ tab: 'food' })

const { current, open } = useModal()
const { foods, filter, filtered, deletingId, refresh, remove } = useMyFoods()

const count = computed(() => `${filtered.value.length} ${filtered.value.length === 1 ? 'food' : 'foods'}`)
const emptyFilterText = computed(() => {
  const f = filter.value
  if (f === 'all') return ''
  return f === 'none' ? 'No foods without a category.' : `No foods in ${categoryLabel(f)}.`
})

// The list is loaded-once shared state; coming back from the edit page must show the saved changes.
onMounted(() => {
  if (foods.value) refresh()
})

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

/** Keep keyboard focus in the list: next row's Delete, else the previous one, else the filter. */
async function confirmDelete(id: string) {
  const idx = filtered.value.findIndex(f => f.id === id)
  await remove(id)
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

    <template v-if="foods">
      <template v-if="foods.length">
        <div class="flex items-end gap-3">
          <!-- Same field as the form's Category select; the card colour keeps it visible on the page background. -->
          <label class="block flex-1 rounded-xl px-3.5 py-2.5 shadow-xs" :class="[ringWithinCls, cardCls]">
            <span class="block text-xs mb-1" :class="inkFaintCls">Category</span>
            <select ref="filterSelect" v-model="filter" class="w-full bg-transparent outline-hidden text-base sm:text-[15px] font-semibold dark:[color-scheme:dark]" :class="inkCls">
              <option value="all">All categories</option>
              <option v-for="cat in CATEGORIES" :key="cat.key" :value="cat.key">{{ cat.label }}</option>
              <option value="none">No category</option>
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
              <div class="min-w-0 flex-1">
                <div class="text-[14.5px] font-semibold truncate" :class="inkCls">{{ food.name }}</div>
                <div class="text-xs" :class="inkFaintCls">{{ food.serving }}<template v-if="food.category"> · {{ categoryLabel(food.category) }}</template> · {{ food.kcal }} kcal<template v-if="food.price !== undefined"> · {{ formatPrice(food.price) }}</template></div>
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
      </template>

      <div v-else class="rounded-2xl px-5 py-8 shadow-xs flex flex-col items-center gap-3" :class="cardCls">
        <p class="text-[14.5px]" :class="inkSoftCls">No custom foods yet.</p>
        <button type="button" class="px-4 py-2 rounded-full bg-ink text-white dark:bg-white dark:text-black text-[13.5px] font-semibold" :class="focusRingCls" @click="open('ingredient')">New ingredient</button>
      </div>
    </template>
  </div>
</template>
