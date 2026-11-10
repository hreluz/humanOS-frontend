<script setup lang="ts">
const { food, photos, index, current } = useFoodPhotos()
const galleryPhotos = computed(() => photos.value.map((p, i) => ({ src: p.url, alt: `${food.value?.name}, photo ${i + 1}` })))
const linkCls = 'underline underline-offset-2'
</script>

<template>
  <ModalShell v-if="food" :label="`${food.name} photos`" panel-class="md:w-[640px] max-h-[92vh]">
    <div class="px-5 pt-5 pb-3 flex items-start justify-between gap-4">
      <h2 class="min-w-0 text-[17px] font-bold" :class="inkCls">{{ food.name }}</h2>
      <ModalCloseButton />
    </div>

    <div class="overflow-y-auto px-5 pb-5">
      <AppPhotoGallery v-model="index" :photos="galleryPhotos">
        <template #credit>
          <!-- Commons licenses require this credit wherever the photo is shown. -->
          <p v-if="current" class="text-[11.5px]" :class="inkFaintCls" data-testid="photo-credit">
            Photo:
            <template v-if="current.author">{{ current.author }} · </template>
            <template v-if="current.license">
              <a v-if="current.licenseUrl" :href="current.licenseUrl" target="_blank" rel="noopener" :class="linkCls">{{ current.license }}</a>
              <template v-else>{{ current.license }}</template>
            </template>
            <template v-if="current.creditUrl">
              <template v-if="current.author || current.license"> · </template>
              <a :href="current.creditUrl" target="_blank" rel="noopener" :class="linkCls">Source</a>
            </template>
          </p>
        </template>
      </AppPhotoGallery>
    </div>
  </ModalShell>
</template>
