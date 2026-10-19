<script setup lang="ts">
import type { BodyView, ExerciseDef, MuscleKey } from '~/types/training'

definePageMeta({ tab: 'body' })

const { view, selected, equipment, exercises, loading, select, toggleEquipment } = useBodyMap()
const { hasExercise, addExercise } = useTraining()
const { openPhotos } = useExercisePhotos()

const VIEWS: { key: BodyView, label: string }[] = [{ key: 'front', label: 'Front' }, { key: 'back', label: 'Back' }]
const MUSCLES = Object.keys(MUSCLE_LABELS) as MuscleKey[]

// On phones the results sit below the figure, so bring them into view after a pick.
const resultsHeading = ref<HTMLElement>()
function pick(muscle: MuscleKey) {
  select(muscle)
  if (matchMedia('(max-width: 767px)').matches) {
    const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches
    nextTick(() => resultsHeading.value?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' }))
  }
}

const adding = ref<string | null>(null)
async function add(def: ExerciseDef) {
  adding.value = def.id
  try {
    await addExercise(def)
  }
  finally {
    adding.value = null
  }
}

const chipCls = 'min-h-11 sm:min-h-8 px-3 rounded-full text-[13px] font-semibold border'
const chipOffCls = ['bg-transparent', dividerCls, inkSoftCls]
const chipOnCls = 'bg-ink text-white border-ink dark:bg-white dark:text-black dark:border-white'
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-[minmax(0,340px)_1fr] gap-4 md:gap-6 max-w-[1060px]">
    <section class="rounded-2xl p-4 shadow-xs flex flex-col gap-3 md:self-start" :class="cardCls" aria-label="Body map">
      <div class="grid grid-cols-2 gap-1 p-1 rounded-[10px]" :class="bgCls" role="radiogroup" aria-label="Body side">
        <button
          v-for="v in VIEWS"
          :key="v.key"
          type="button"
          role="radio"
          :aria-checked="view === v.key"
          :class="[segmentCls, focusRingCls, view === v.key ? segmentOnCls : inkSoftCls]"
          @click="view = v.key"
        >
          {{ v.label }}
        </button>
      </div>
      <div class="mx-auto w-full max-w-[170px] md:max-w-[260px]">
        <AppBodyFigure :view="view" :selected="selected" @select="pick" />
      </div>
      <p class="text-[12.5px] text-center" :class="inkFaintCls">Tap a muscle on the body or pick one below.</p>
      <div class="flex flex-wrap gap-1.5 justify-center" aria-label="Muscles">
        <button
          v-for="m in MUSCLES"
          :key="m"
          type="button"
          class="min-h-9 sm:min-h-7 px-2.5 rounded-full text-[12px] font-semibold"
          :class="[focusRingCls, selected === m ? 'bg-accent-coral text-white dark:bg-accent-coral-dark' : [bgCls, inkSoftCls]]"
          :aria-pressed="selected === m"
          @click="pick(m)"
        >
          {{ MUSCLE_LABELS[m] }}
        </button>
      </div>
    </section>

    <div class="flex flex-col gap-3.5">
      <div class="flex flex-col gap-2.5">
        <h2 ref="resultsHeading" class="text-[20px] font-bold tracking-tight scroll-mt-4" :class="inkCls">
          {{ selected ? MUSCLE_LABELS[selected] : 'Find exercises' }}
        </h2>
        <div class="flex flex-wrap gap-2" role="group" aria-label="Equipment">
          <button
            v-for="key in EQUIPMENT_KEYS"
            :key="key"
            type="button"
            :class="[chipCls, focusRingCls, equipment.includes(key) ? chipOnCls : chipOffCls]"
            :aria-pressed="equipment.includes(key)"
            @click="toggleEquipment(key)"
          >
            {{ EQUIPMENT_LABELS[key] }}
          </button>
        </div>
      </div>

      <div v-if="!selected" class="rounded-2xl px-5 py-8 shadow-xs text-center" :class="cardCls">
        <div class="text-[15px] font-semibold mb-1" :class="inkCls">Tap a muscle to see exercises</div>
        <div class="text-[13.5px]" :class="inkSoftCls">Choose the equipment you have and add exercises to today's workout.</div>
      </div>
      <div v-else-if="!equipment.length" class="rounded-2xl px-5 py-6 shadow-xs text-[14px]" :class="[cardCls, inkSoftCls]">
        Pick at least one type of equipment.
      </div>
      <div v-else-if="loading && !exercises.length" class="rounded-2xl px-5 py-6 shadow-xs text-[14px]" :class="[cardCls, inkFaintCls]">
        Loading exercises…
      </div>
      <div v-else-if="!exercises.length" class="rounded-2xl px-5 py-6 shadow-xs text-[14px]" :class="[cardCls, inkSoftCls]">
        No exercises for this filter.
      </div>
      <ul v-else class="flex flex-col gap-3" :aria-busy="loading" :aria-label="`${MUSCLE_LABELS[selected]} exercises`">
        <li v-for="ex in exercises" :key="ex.id" class="rounded-2xl px-4 sm:px-5 py-4 shadow-xs flex gap-3.5 sm:gap-4 items-center" :class="cardCls">
          <button
            v-if="ex.photos.length"
            type="button"
            class="relative shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-white border"
            :class="[dividerCls, focusRingCls]"
            :aria-label="`View photos of ${ex.name}`"
            @click="openPhotos(ex)"
          >
            <img :src="ex.photos[0]!.src" alt="" loading="lazy" class="w-full h-full object-cover">
            <span class="absolute bottom-1 right-1 rounded-md bg-black/70 text-white text-[10.5px] font-semibold px-1.5 leading-[18px]">{{ ex.photos.length }}</span>
          </button>
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-baseline gap-x-2">
              <h3 class="text-[15.5px] font-bold" :class="inkCls">{{ ex.name }}</h3>
              <span class="text-[12.5px]" :class="inkFaintCls">{{ EQUIPMENT_LABELS[ex.equipment] }}</span>
            </div>
            <p class="text-[13.5px] mt-0.5" :class="inkSoftCls">{{ ex.cue }}</p>
          </div>
          <span
            v-if="hasExercise(ex.name)"
            class="shrink-0 inline-flex items-center gap-1 text-[13px] font-semibold"
            :class="ACCENT.green.icon"
          >
            <AppIcon :path="ICONS.check" class="w-4 h-4" />Added
          </span>
          <button
            v-else
            type="button"
            class="shrink-0 min-h-11 sm:min-h-9 px-3.5 rounded-[10px] text-[13px] font-semibold bg-ink text-white dark:bg-white dark:text-black disabled:opacity-50"
            :class="focusRingCls"
            :disabled="adding === ex.id"
            :aria-label="`Add ${ex.name} to today's workout`"
            @click="add(ex)"
          >
            + Add
          </button>
        </li>
      </ul>
      <NuxtLink v-if="selected" to="/train" class="text-[13.5px] font-semibold self-start" :class="linkBlueCls">See today's workout →</NuxtLink>
    </div>
  </div>
</template>
