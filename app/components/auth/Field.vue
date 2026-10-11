<script setup lang="ts">
withDefaults(defineProps<{
  label: string
  type?: string
  placeholder?: string
  error?: string
  suffix?: string
  autocomplete?: string
  readonly?: boolean
}>(), { type: 'text' })

const model = defineModel<string>({ required: true })
const id = useId()
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label :for="id" class="text-[12.5px] font-semibold text-black/55 dark:text-white/55">{{ label }}</label>
    <div
      class="flex items-center rounded-xl bg-[#F2F2F7] dark:bg-white/[0.06] border"
      :class="error ? 'border-[#FF6B4A]' : 'border-transparent focus-within:border-black/20 dark:focus-within:border-white/25'"
    >
      <input
        :id="id"
        :value="model"
        :type="type"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :readonly="readonly"
        :aria-invalid="!!error"
        :aria-describedby="error ? `${id}-error` : undefined"
        @input="model = ($event.target as HTMLInputElement).value"
        class="flex-1 min-w-0 bg-transparent px-3.5 h-11 text-[15px] text-[#0B0B0C] dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30 outline-hidden"
      >
      <span v-if="suffix || $slots.suffix" class="pr-3.5 text-[13px] text-black/40 dark:text-white/40">
        <slot name="suffix">{{ suffix }}</slot>
      </span>
    </div>
    <span v-if="error" :id="`${id}-error`" class="text-[12px] text-[#FF6B4A]">{{ error }}</span>
  </div>
</template>
