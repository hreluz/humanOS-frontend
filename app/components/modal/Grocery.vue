<script setup lang="ts">
const { list, itemCount, total, toggle } = useGrocery()
</script>

<template>
  <ModalShell label="Grocery list" panel-class="md:w-[460px] max-h-[85vh] md:max-h-[640px]">
    <div class="p-5 border-b flex items-center justify-between" :class="dividerCls">
      <div>
        <span class="text-base font-bold" :class="inkCls">Grocery List</span>
        <div class="text-xs mt-0.5" :class="inkFaintCls">{{ itemCount }} items · est. ${{ total }}</div>
      </div>
      <ModalCloseButton />
    </div>
    <div class="flex-1 overflow-auto px-5 pb-5 pt-3">
      <div v-for="grp in list?.groups ?? []" :key="grp.cat">
        <div class="text-[11.5px] font-bold tracking-wide uppercase mt-2.5 mb-2" :class="inkFaintCls">{{ grp.cat }}</div>
        <div class="rounded-2xl overflow-hidden mb-3.5" :class="bgCls">
          <button
            v-for="it in grp.items"
            :key="it.id"
            type="button"
            role="checkbox"
            :aria-checked="!!list?.checked[it.id]"
            class="w-full flex items-center gap-3 px-3.5 py-2.5 border-b last:border-b-0 text-left"
            :class="dividerCls"
            @click="toggle(it.id)"
          >
            <div
              class="w-[18px] h-[18px] rounded-md border shrink-0 flex items-center justify-center"
              :class="list?.checked[it.id] ? 'bg-accent-blue dark:bg-accent-blue-dark border-accent-blue dark:border-accent-blue-dark' : 'border-black/20 dark:border-white/30'"
            >
              <svg v-if="list?.checked[it.id]" width="9" height="7" viewBox="0 0 11 9"><path d="M1 4.5L4 8l6-7" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" /></svg>
            </div>
            <div class="flex-1 text-sm" :class="list?.checked[it.id] ? [inkFaintCls, 'line-through'] : inkCls">{{ it.name }}</div>
            <span class="text-[13px]" :class="list?.checked[it.id] ? inkFaintCls : inkCls">${{ it.price }}</span>
          </button>
        </div>
      </div>
    </div>
  </ModalShell>
</template>
