<script setup lang="ts">
const { exercise, photos, index, current } = useExercisePhotos()
const { label: equipmentLabel } = useEquipmentCatalog()

const subtitle = computed(() => {
  if (!exercise.value) return ''
  const group = equipmentLabel(exercise.value.equipmentGroup)
  return exercise.value.cue ? `${group} · ${exercise.value.cue}` : group
})

const galleryPhotos = computed(() => photos.value.map(p => ({ src: p.src, alt: `${exercise.value?.name}: ${p.caption}`, label: p.caption })))
</script>

<template>
  <ModalShell v-if="exercise" :label="`${exercise.name} photos`" panel-class="md:w-[640px] max-h-[92vh]">
    <div class="px-5 pt-5 pb-3 flex items-start justify-between gap-4">
      <div class="min-w-0">
        <h2 class="text-[17px] font-bold" :class="inkCls">{{ exercise.name }}</h2>
        <p class="text-[13px]" :class="inkSoftCls">{{ subtitle }}</p>
      </div>
      <ModalCloseButton />
    </div>

    <div class="overflow-y-auto px-5 pb-5">
      <AppPhotoGallery v-model="index" :photos="galleryPhotos">
        <template #caption>
          <div class="flex justify-between items-baseline gap-3" aria-live="polite">
            <span class="text-[14px] font-semibold" :class="inkCls">{{ current?.caption }}</span>
            <span class="text-[13px] shrink-0 tabular-nums" :class="inkFaintCls">{{ index + 1 }} / {{ photos.length }}</span>
          </div>
        </template>
        <template #credit>
          <p v-if="current?.author" class="text-[11.5px]" :class="inkFaintCls">
            Photo:
            <a v-if="current.creditUrl" :href="current.creditUrl" target="_blank" rel="noopener" class="underline underline-offset-2">{{ current.author }}</a>
            <template v-else>{{ current.author }}</template>
            ({{ current.license }})
          </p>
          <p v-else-if="current?.source === 'free_exercise_db'" class="text-[11.5px]" :class="inkFaintCls">
            Photos: <a href="https://github.com/yuhonas/free-exercise-db" target="_blank" rel="noopener" class="underline underline-offset-2">free-exercise-db</a> (public domain)
          </p>
        </template>
      </AppPhotoGallery>
    </div>
  </ModalShell>
</template>
