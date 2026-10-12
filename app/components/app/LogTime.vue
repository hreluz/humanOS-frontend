<script setup lang="ts">
// When a log happened: reads as one line ("Today, 2:45 PM") and opens into a day strip and a time field.
const props = defineProps<{ days: Date[], now: Date, at: Date, isNow: boolean }>()
const day = defineModel<number>('day', { required: true })
const time = defineModel<string>('time', { required: true })
const emit = defineEmits<{ reset: [] }>()

const open = ref(false)
const panelId = useId()
const dayKeys = computed(() => props.days.map(d => d.getTime()))
const { tabindex, onKeydown } = useRadioGroup(dayKeys, day)

const isToday = computed(() => isSameDay(props.at, props.now))
const dayChip = (d: Date) => {
  const label = formatDayLabel(d, props.now)
  return label === 'Today' || label === 'Yesterday' ? label : d.toLocaleDateString('en-US', { weekday: 'short' }) + ' ' + d.getDate()
}

// Commit on change (not every keystroke); if the value was clamped or rejected, show what was kept.
function onTimeChange(e: Event) {
  const el = e.target as HTMLInputElement
  if (el.value) time.value = el.value
  nextTick(() => { el.value = time.value })
}
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
            <button type="button" class="font-semibold" :class="[linkBlueCls, focusRingCls]" @click="emit('reset')">Use right now</button>
          </template>
        </div>
      </div>
      <button
        type="button"
        :aria-expanded="open"
        :aria-controls="panelId"
        class="h-9 shrink-0 rounded-full pl-3.5 pr-2.5 flex items-center gap-1.5 text-[14px] font-semibold tabular-nums"
        :class="[bgCls, inkCls, focusRingCls]"
        @click="open = !open"
      >
        {{ formatLogWhen(at, now) }}
        <AppIcon :path="ICONS.chevronUp" class="w-3.5 h-3.5 transition-transform motion-reduce:transition-none" :class="[inkSoftCls, open ? '' : 'rotate-180']" />
      </button>
    </div>

    <div v-if="open" :id="panelId" class="flex flex-col gap-3">
      <div class="flex gap-1 p-1 rounded-xl overflow-x-auto" :class="bgCls" role="radiogroup" aria-label="Day" @keydown="onKeydown">
        <button
          v-for="d in days"
          :key="d.getTime()"
          type="button"
          role="radio"
          :aria-checked="day === d.getTime()"
          :aria-label="formatDayLabel(d, now) === dayChip(d) ? undefined : formatDayLabel(d, now)"
          :tabindex="tabindex(d.getTime())"
          class="px-3 shrink-0 whitespace-nowrap"
          :class="[segmentCls, focusRingCls, day === d.getTime() ? segmentOnCls : inkSoftCls]"
          @click="day = d.getTime()"
        >
          {{ dayChip(d) }}
        </button>
      </div>
      <label class="flex items-center gap-3">
        <span class="flex-1 min-w-0">
          <span class="block text-[14px] font-semibold" :class="inkCls">Time</span>
          <span v-if="isToday" class="block text-xs" :class="inkFaintCls">Can't be later than now</span>
        </span>
        <input
          type="time"
          :value="time"
          :max="isToday ? toTimeValue(now) : undefined"
          required
          class="h-9 rounded-full px-3.5 text-[14.5px] font-semibold tabular-nums dark:[color-scheme:dark]"
          :class="[bgCls, inkCls, focusRingCls]"
          @change="onTimeChange"
        >
      </label>
    </div>
  </div>
</template>
