<script setup lang="ts">
// When a log happened: reads as one line ("Today, 2:45 PM") and opens into a day strip and a time field.
const props = defineProps<{ days: Date[], now: Date, at: Date, isNow: boolean }>()
const day = defineModel<number>('day', { required: true })
const time = defineModel<string>('time', { required: true })
const emit = defineEmits<{ reset: [] }>()

const open = ref(false)
const panelId = useId()
const timeId = useId()
const hintId = useId()
const chip = useTemplateRef('chip')
const strip = useTemplateRef('strip')
const dayKeys = computed(() => props.days.map(d => d.getTime()))
const { tabindex, onKeydown } = useRadioGroup(dayKeys, day)

const isToday = computed(() => isSameDay(props.at, props.now))
const dayChip = (d: Date) => {
  const label = formatDayLabel(d, props.now)
  return label === 'Today' || label === 'Yesterday' ? label : d.toLocaleDateString('en-US', { weekday: 'short' }) + ' ' + d.getDate()
}

// Set when a typed time was later than now and got pulled back; explains the change until the next edit.
const clamped = ref(false)
watch(isToday, (today) => {
  if (!today) clamped.value = false
})

// Commit on change (not every keystroke); if the value was clamped or rejected, show what was kept.
function onTimeChange(e: Event) {
  const el = e.target as HTMLInputElement
  const typed = el.value
  if (typed) time.value = typed
  nextTick(() => {
    clamped.value = !!typed && time.value !== typed
    el.value = time.value
  })
}

// The reset link removes itself, so focus moves to the button that shows the time.
function reset() {
  clamped.value = false
  emit('reset')
  nextTick(() => chip.value?.focus())
}

// The strip scrolls on narrow screens: fade the right edge while more days are hidden there.
const moreDays = ref(false)
function onStripScroll() {
  const el = strip.value
  moreDays.value = !!el && el.scrollLeft + el.clientWidth < el.scrollWidth - 1
}

watch(open, (isOpen) => {
  if (!isOpen) return
  nextTick(() => {
    strip.value?.querySelector('[aria-checked="true"]')?.scrollIntoView({ inline: 'nearest', block: 'nearest' })
    onStripScroll()
  })
})
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex items-center gap-3">
      <div class="flex-1 min-w-0">
        <div class="text-[14px] font-semibold" :class="inkCls">When</div>
        <div class="text-xs" :class="inkFaintCls">
          <template v-if="isNow">Right now</template>
          <template v-else>
            Changed from right now.
            <button type="button" class="font-semibold py-2 -my-2" :class="[linkBlueCls, focusRingCls]" @click="reset">Use right now</button>
          </template>
        </div>
      </div>
      <button
        ref="chip"
        type="button"
        :aria-expanded="open"
        :aria-controls="panelId"
        class="min-h-11 sm:min-h-9 shrink-0 rounded-full pl-3.5 pr-2.5 flex items-center gap-1.5 text-[14px] font-semibold tabular-nums"
        :class="[bgCls, inkCls, focusRingCls]"
        @click="open = !open"
      >
        {{ formatLogWhen(at, now) }}
        <AppIcon :path="ICONS.chevronUp" class="w-3.5 h-3.5 transition-transform motion-reduce:transition-none" :class="[inkSoftCls, open ? '' : 'rotate-180']" />
      </button>
    </div>

    <div v-if="open" :id="panelId" class="flex flex-col gap-3">
      <div
        ref="strip"
        class="flex gap-1 p-1 rounded-xl overflow-x-auto snap-x scroll-px-1"
        :class="[bgCls, moreDays ? '[mask-image:linear-gradient(to_right,black_80%,transparent)]' : '']"
        role="radiogroup"
        aria-label="Day"
        @keydown="onKeydown"
        @scroll.passive="onStripScroll"
      >
        <button
          v-for="d in days"
          :key="d.getTime()"
          type="button"
          role="radio"
          :aria-checked="day === d.getTime()"
          :aria-label="formatDayLabel(d, now) === dayChip(d) ? undefined : formatDayLabel(d, now)"
          :tabindex="tabindex(d.getTime())"
          class="px-3 shrink-0 snap-start whitespace-nowrap"
          :class="[segmentCls, focusRingCls, day === d.getTime() ? segmentOnCls : inkSoftCls]"
          @click="day = d.getTime()"
        >
          {{ dayChip(d) }}
        </button>
      </div>
      <div class="flex items-center gap-3">
        <div class="flex-1 min-w-0">
          <label :for="timeId" class="block text-[14px] font-semibold" :class="inkCls">Time</label>
          <div :id="hintId" class="text-xs" :class="inkFaintCls" aria-live="polite">
            <template v-if="clamped">Can't be later than now</template>
          </div>
        </div>
        <input
          :id="timeId"
          type="time"
          :value="time"
          :max="isToday ? toTimeValue(now) : undefined"
          required
          :aria-describedby="hintId"
          class="min-h-11 sm:min-h-9 rounded-full px-3.5 text-[14.5px] font-semibold tabular-nums dark:[color-scheme:dark]"
          :class="[bgCls, inkCls, focusRingCls]"
          @change="onTimeChange"
        >
      </div>
    </div>
  </div>
</template>
