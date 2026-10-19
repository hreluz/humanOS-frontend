<script setup lang="ts">
// – [amount] unit + : the amount can be nudged by a step or typed exactly. The parent owns the step size.
const props = withDefaults(defineProps<{ unit: string, label: string, integer?: boolean, max?: number }>(), { max: Infinity })
const model = defineModel<number>({ required: true })
const emit = defineEmits<{ step: [dir: 1 | -1] }>()

const fmt = (n: number) => String(n)
const btnCls = ['w-8 h-8 rounded-full flex items-center justify-center text-base hover:bg-white dark:hover:bg-white/10', inkCls, focusRingCls]
const text = ref(fmt(model.value))
const focused = ref(false)

// Outside edits (– / +) show up in the field unless the user is mid-typing.
watch(model, (v) => {
  if (!focused.value) text.value = fmt(v)
})

function onInput() {
  const n = parseAmount(text.value, { integer: props.integer, max: props.max })
  if (n !== null) model.value = n
}

function onFocus(e: FocusEvent) {
  focused.value = true
  ;(e.target as HTMLInputElement).select()
}

// Leaving the field always shows a valid amount: the last one parsed, capped at max.
function onBlur() {
  focused.value = false
  text.value = fmt(model.value)
}
</script>

<template>
  <!-- One capsule: the buttons and the amount share a background; typing in the amount rings the whole control. -->
  <div
    class="h-9 shrink-0 flex items-center rounded-full p-0.5 has-[input:focus]:ring-2 has-[input:focus]:ring-ink/50 dark:has-[input:focus]:ring-white/60"
    :class="bgCls"
  >
    <button type="button" :aria-label="`Less ${label}`" :class="btnCls" @click="emit('step', -1)">–</button>
    <label class="w-[92px] h-full flex items-center justify-center gap-1 cursor-text">
      <input
        v-model="text"
        type="text"
        :inputmode="integer ? 'numeric' : 'decimal'"
        autocomplete="off"
        :aria-label="`${label} amount`"
        :size="Math.max(2, text.length)"
        class="min-w-0 bg-transparent outline-none text-right text-[14.5px] font-semibold tabular-nums"
        :class="inkCls"
        @input="onInput"
        @focus="onFocus"
        @blur="onBlur"
        @keydown.enter.prevent="($event.target as HTMLInputElement).blur()"
      >
      <span class="text-[13px]" :class="inkSoftCls">{{ unit }}</span>
    </label>
    <button type="button" :aria-label="`More ${label}`" :class="btnCls" @click="emit('step', 1)">+</button>
  </div>
</template>
