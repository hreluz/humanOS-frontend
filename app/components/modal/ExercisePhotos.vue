<script setup lang="ts">
const { exercise, photos, index, current, goTo, next, prev } = useExercisePhotos()

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowRight') next()
  else if (e.key === 'ArrowLeft') prev()
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

// Horizontal swipe on the photo steps through the gallery.
const SWIPE_PX = 40
let startX: number | null = null
function onPointerDown(e: PointerEvent) {
  startX = e.clientX
}
function onPointerUp(e: PointerEvent) {
  if (startX === null) return
  const dx = e.clientX - startX
  startX = null
  if (dx <= -SWIPE_PX) next()
  else if (dx >= SWIPE_PX) prev()
}

// Keep the current thumbnail visible in the strip.
const thumbs = ref<HTMLButtonElement[]>([])
watch(index, i => thumbs.value[i]?.scrollIntoView({ block: 'nearest', inline: 'nearest' }))

const arrowCls = [
  'absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center shadow-md',
  // Light in both themes: the photos are mostly dark gym interiors.
  'bg-white/90 text-ink', focusRingCls,
]
</script>

<template>
  <ModalShell v-if="exercise" :label="`${exercise.name} photos`" panel-class="md:w-[640px] max-h-[92vh]">
    <div class="px-5 pt-5 pb-3 flex items-start justify-between gap-4">
      <div class="min-w-0">
        <h2 class="text-[17px] font-bold" :class="inkCls">{{ exercise.name }}</h2>
        <p class="text-[13px]" :class="inkSoftCls">{{ EQUIPMENT_LABELS[exercise.equipment] }} · {{ exercise.cue }}</p>
      </div>
      <ModalCloseButton />
    </div>

    <div class="overflow-y-auto px-5 pb-5 flex flex-col gap-3">
      <div
        class="relative rounded-xl overflow-hidden aspect-[3/2] select-none touch-pan-y"
        :class="bgCls"
        @pointerdown="onPointerDown"
        @pointerup="onPointerUp"
        @pointercancel="startX = null"
      >
        <img
          v-if="current"
          :key="current.src"
          :src="current.src"
          :alt="`${exercise.name}: ${current.caption}`"
          class="w-full h-full object-contain bg-white"
          draggable="false"
        >
        <template v-if="photos.length > 1">
          <button type="button" :class="arrowCls" class="left-2" aria-label="Previous photo" @click="prev">
            <AppIcon :path="ICONS.chevronRight" class="w-4 h-4 rotate-180" />
          </button>
          <button type="button" :class="arrowCls" class="right-2" aria-label="Next photo" @click="next">
            <AppIcon :path="ICONS.chevronRight" class="w-4 h-4" />
          </button>
        </template>
      </div>

      <div class="flex justify-between items-baseline gap-3" aria-live="polite">
        <span class="text-[14px] font-semibold" :class="inkCls">{{ current?.caption }}</span>
        <span class="text-[13px] shrink-0 tabular-nums" :class="inkFaintCls">{{ index + 1 }} / {{ photos.length }}</span>
      </div>

      <div class="flex gap-2 overflow-x-auto py-1 -mx-1 px-1" aria-label="All photos">
        <button
          v-for="(p, i) in photos"
          :key="p.src"
          ref="thumbs"
          type="button"
          class="shrink-0 w-[72px] aspect-[3/2] rounded-lg overflow-hidden bg-white ring-2 ring-offset-2 ring-offset-white dark:ring-offset-surface-dark"
          :class="[focusRingCls, i === index ? 'ring-ink dark:ring-white' : 'ring-transparent opacity-70']"
          :aria-label="`Photo ${i + 1}: ${p.caption}`"
          :aria-current="i === index ? 'true' : undefined"
          @click="goTo(i)"
        >
          <img :src="p.src" alt="" loading="lazy" class="w-full h-full object-cover" draggable="false">
        </button>
      </div>

      <p class="text-[11.5px]" :class="inkFaintCls">
        Photos: <a href="https://github.com/yuhonas/free-exercise-db" target="_blank" rel="noopener" class="underline underline-offset-2">free-exercise-db</a> (public domain)
      </p>
    </div>
  </ModalShell>
</template>
