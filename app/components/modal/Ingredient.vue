<script setup lang="ts">
import type { FoodItem } from '~/types/food'

const { close } = useModal()
const saved = ref<FoodItem | null>(null)
// Remounts the form so "Create another" starts from empty fields.
const formKey = ref(0)

function createAnother() {
  saved.value = null
  formKey.value++
}
</script>

<template>
  <ModalShell label="New ingredient" panel-class="md:w-[480px] max-h-[90vh] md:max-h-[680px]">
    <div class="p-5 border-b flex items-center justify-between" :class="dividerCls">
      <span class="text-base font-bold" :class="inkCls">New ingredient</span>
      <ModalCloseButton />
    </div>
    <div class="flex-1 overflow-auto p-5 flex flex-col">
      <div v-if="saved" class="flex flex-col gap-4" role="status">
        <div class="rounded-2xl px-4 py-3.5 flex items-center gap-3" :class="bgCls">
          <span class="w-8 h-8 rounded-full flex items-center justify-center shrink-0" :class="[ACCENT.green.iconBg, ACCENT.green.icon]">
            <AppIcon :path="ICONS.check" class="w-4 h-4" />
          </span>
          <div class="min-w-0">
            <div class="text-[14.5px] font-semibold" :class="inkCls">{{ saved.name }} saved to My foods.</div>
            <div class="text-xs" :class="inkFaintCls">{{ saved.serving }} · {{ saved.kcal }} kcal</div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <button type="button" class="h-[46px] rounded-full text-[14.5px] font-semibold border" :class="[dividerCls, inkCls, focusRingCls]" @click="createAnother">Create another</button>
          <button type="button" class="h-[46px] rounded-full bg-ink text-white dark:bg-white dark:text-black text-[14.5px] font-semibold" :class="focusRingCls" @click="close">Done</button>
        </div>
      </div>
      <AppIngredientForm v-else :key="formKey" submit-label="Save ingredient" @created="saved = $event" />
    </div>
  </ModalShell>
</template>
