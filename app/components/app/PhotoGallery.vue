<script setup lang="ts">
// One photo at a time with arrows, swipe and arrow keys, plus a thumbnail strip. Each viewer renders its own credit line
// (and, optionally, a caption row under the photo) through slots, since every photo source credits differently.
// `label` names a thumbnail ("Photo 2: {label}"); it falls back to `alt`.
const props = defineProps<{ photos: { src: string, alt: string, label?: string }[] }>()
const index = defineModel<number>({ required: true })

const current = computed(() => props.photos[index.value] ?? null)

function goTo(i: number) {
  const n = props.photos.length
  if (n) index.value = ((i % n) + n) % n
}
const next = () => goTo(index.value + 1)
const prev = () => goTo(index.value - 1)

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
  // Light in both themes: photos are mostly busy, dark or white-backed.
  'bg-white/90 text-ink', focusRingCls,
]
</script>

<template>
  <div class="flex flex-col gap-3">
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
        :alt="current.alt"
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

    <slot name="caption" :index="index" />

    <div class="flex gap-2 overflow-x-auto py-1 -mx-1 px-1" aria-label="All photos">
      <button
        v-for="(p, i) in photos"
        :key="p.src"
        ref="thumbs"
        type="button"
        class="shrink-0 w-[72px] aspect-[3/2] rounded-lg overflow-hidden bg-white ring-2 ring-offset-2 ring-offset-white dark:ring-offset-surface-dark"
        :class="[focusRingCls, i === index ? 'ring-ink dark:ring-white' : 'ring-transparent opacity-70']"
        :aria-label="`Photo ${i + 1}: ${p.label ?? p.alt}`"
        :aria-current="i === index ? 'true' : undefined"
        @click="goTo(i)"
      >
        <img :src="p.src" alt="" loading="lazy" class="w-full h-full object-cover" draggable="false">
      </button>
    </div>

    <slot name="credit" :index="index" />
  </div>
</template>
