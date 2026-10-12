<script setup lang="ts">
const { close } = useModal()
const {
  recipe, filteredCatalog, query, showPicker, pickerMode, totals, perServing,
  togglePicker, changeServings, addIngredient, removeIngredient, startCreate, save,
} = useRecipe()

const ingredientsOpen = ref(false)
const ingredientsId = useId()
const ingredientCount = computed(() => recipe.value?.ingredients.length ?? 0)
const ingredientNames = computed(() => recipe.value?.ingredients.map(i => i.name).join(' | ') || 'No ingredients yet')

// Re-open the list after adding so the new ingredient is visible (not when the draft first loads).
watch(() => recipe.value?.ingredients.length, (n, prev) => { if (prev !== undefined && n! > prev) ingredientsOpen.value = true })

const searchInput = ref<HTMLInputElement>()
const focusSearch = () => nextTick(() => searchInput.value?.focus())

watch(showPicker, (open) => { if (open) focusSearch() })

function backToList() {
  pickerMode.value = 'list'
  focusSearch()
}

/** Escape steps out one level: create form → list → recipe → closed. */
function onEscape() {
  if (showPicker.value && pickerMode.value === 'create') backToList()
  else if (showPicker.value) showPicker.value = false
  else close()
}

async function onSave() {
  await save()
  close()
}
</script>

<template>
  <ModalShell label="New recipe" panel-class="md:w-[480px] max-h-[90vh] md:max-h-[680px] relative" :on-escape="onEscape">
    <div class="p-5 border-b flex items-center justify-between" :class="dividerCls">
      <span class="text-base font-bold" :class="inkCls">New Recipe</span>
      <ModalCloseButton />
    </div>
    <div v-if="recipe" class="flex-1 overflow-auto p-5">
      <label class="block rounded-2xl px-4 py-3.5 mb-3" :class="bgCls">
        <div class="text-xs mb-1" :class="inkFaintCls">Recipe name</div>
        <input v-model="recipe.name" class="w-full bg-transparent outline-hidden text-base font-semibold" :class="inkCls">
      </label>
      <div class="rounded-2xl px-4 py-3.5 mb-[18px] flex items-center justify-between" :class="bgCls">
        <div class="text-sm" :class="inkSoftCls">Makes</div>
        <div class="flex items-center gap-3">
          <button type="button" aria-label="Fewer servings" class="w-6 h-6 rounded-full shadow-sm flex items-center justify-center text-[15px]" :class="[cardCls, inkCls]" @click="changeServings(-1)">–</button>
          <span class="text-[15px] font-semibold" :class="inkCls">{{ recipe.servings }} {{ recipe.servings === 1 ? 'serving' : 'servings' }}</span>
          <button type="button" aria-label="More servings" class="w-6 h-6 rounded-full bg-ink flex items-center justify-center text-[15px] text-white" @click="changeServings(1)">+</button>
        </div>
      </div>
      <button
        type="button"
        :aria-expanded="ingredientsOpen"
        :aria-controls="ingredientsId"
        class="w-full min-h-11 -mt-2 mb-1 rounded flex items-center justify-between gap-3 text-left"
        :class="focusRingCls"
        @click="ingredientsOpen = !ingredientsOpen"
      >
        <span class="text-xs font-bold tracking-wide uppercase" :class="inkFaintCls">Ingredients</span>
        <span class="flex items-center gap-1.5 text-xs tabular-nums" :class="inkFaintCls">
          {{ ingredientCount }} {{ ingredientCount === 1 ? 'item' : 'items' }} · {{ Math.round(totals.kcal) }} kcal
          <AppIcon :path="ICONS.chevronUp" class="w-3.5 h-3.5 transition-transform motion-reduce:transition-none" :class="[inkSoftCls, ingredientsOpen ? '' : 'rotate-180']" />
        </span>
      </button>
      <p v-if="!ingredientsOpen" class="rounded-xl px-3.5 py-2.5 mb-3.5 text-[13px] leading-snug line-clamp-2" :class="[bgCls, inkSoftCls]">{{ ingredientNames }}</p>
      <div v-else :id="ingredientsId" class="flex flex-col gap-2 mb-3.5">
        <div v-for="(ing, idx) in recipe.ingredients" :key="idx" class="rounded-xl px-3.5 py-2.5 flex items-center gap-3" :class="bgCls">
          <div class="flex-1">
            <div class="text-sm font-semibold" :class="inkCls">{{ ing.name }}</div>
            <div class="text-xs" :class="inkFaintCls">{{ ing.kcal }} kcal · {{ ing.p }}g protein · {{ ing.c }}g carbs</div>
          </div>
          <button type="button" :aria-label="`Remove ${ing.name}`" class="w-6 h-6 rounded-full flex items-center justify-center text-[15px]" :class="[cardCls, inkFaintCls]" @click="removeIngredient(idx)">×</button>
        </div>
      </div>
      <button type="button" class="w-full border-[1.5px] border-dashed border-accent-blue/40 rounded-xl px-3.5 py-2.5 flex items-center justify-center gap-2 text-[13.5px] font-semibold mb-[18px]" :class="linkBlueCls" @click="togglePicker">+ Add ingredient</button>
      <div class="text-xs font-bold tracking-wide uppercase mb-2.5" :class="inkFaintCls">Per serving</div>
      <div class="bg-ink rounded-2xl p-4 flex flex-col gap-2.5 mb-4">
        <div class="flex justify-between items-baseline"><span class="text-[13px] text-white/60">Calories</span><span class="text-lg font-bold text-white">{{ perServing.kcal }} kcal</span></div>
        <div class="flex justify-between"><span class="text-[13px] text-white/60">Protein</span><span class="text-[13.5px] font-semibold text-white">{{ perServing.p }}g</span></div>
        <div class="flex justify-between"><span class="text-[13px] text-white/60">Carbs</span><span class="text-[13.5px] font-semibold text-white">{{ perServing.c }}g</span></div>
      </div>
      <button type="button" class="w-full h-[46px] rounded-full bg-ink text-white flex items-center justify-center text-[14.5px] font-semibold" @click="onSave">Save recipe</button>

      <div v-if="showPicker && pickerMode === 'list'" class="absolute inset-0 p-5 flex flex-col gap-2 overflow-auto" :class="cardCls">
        <div class="flex justify-between items-center mb-1">
          <span class="text-[15px] font-bold" :class="inkCls">Add ingredient</span>
          <button type="button" class="text-[13.5px] font-semibold rounded" :class="[linkBlueCls, focusRingCls]" @click="showPicker = false">Cancel</button>
        </div>
        <label class="rounded-xl px-3.5 py-2.5 flex items-center gap-2 mb-1 focus-within:ring-2 focus-within:ring-ink/40 dark:focus-within:ring-white/50" :class="bgCls">
          <AppIcon :path="ICONS.search" class="w-[15px] h-[15px]" :class="inkFaintCls" />
          <input ref="searchInput" v-model="query" type="search" placeholder="Search ingredients" aria-label="Search ingredients" class="flex-1 min-w-0 bg-transparent outline-hidden text-base sm:text-[14.5px] placeholder:text-black/30 dark:placeholder:text-white/30" :class="inkCls">
        </label>
        <button
          v-for="item in filteredCatalog"
          :key="item.id"
          type="button"
          class="rounded-xl px-3.5 py-2.5 flex items-center justify-between text-left"
          :class="[bgCls, focusRingCls]"
          @click="addIngredient(item)"
        >
          <div>
            <div class="text-sm font-semibold" :class="inkCls">{{ item.name }}</div>
            <div class="text-[11.5px]" :class="inkFaintCls"><template v-if="item.brand === 'My food'">My food · </template>{{ item.serving }} · {{ item.kcal }} kcal · {{ item.p }}g protein · {{ item.c }}g carbs</div>
          </div>
          <span class="text-base" :class="linkBlueCls">+</span>
        </button>
        <div v-if="!filteredCatalog.length" class="text-[13.5px] py-3 text-center" :class="inkFaintCls">No match for “{{ query.trim() }}”.</div>
        <button type="button" class="shrink-0 border-[1.5px] border-dashed border-accent-blue/40 rounded-xl px-3.5 py-2.5 flex items-center justify-center gap-2 text-[13.5px] font-semibold" :class="[linkBlueCls, focusRingCls]" @click="startCreate">
          {{ query.trim() ? `+ Create “${query.trim()}”` : '+ Create ingredient' }}
        </button>
      </div>

      <div v-if="showPicker && pickerMode === 'create'" class="absolute inset-0 p-5 flex flex-col gap-3 overflow-auto" :class="cardCls">
        <div class="flex justify-between items-center mb-1">
          <span class="text-[15px] font-bold" :class="inkCls">New ingredient</span>
          <button type="button" class="text-[13.5px] font-semibold rounded" :class="[linkBlueCls, focusRingCls]" @click="backToList">Back</button>
        </div>
        <AppIngredientForm :initial-name="query.trim()" submit-label="Add to recipe" @created="addIngredient" />
      </div>
    </div>
  </ModalShell>
</template>
