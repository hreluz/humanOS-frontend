<script setup lang="ts">
import type { BodyView, ExerciseDef, ExerciseKind, MuscleKey } from '~/types/training'

definePageMeta({ tab: 'body' })

const {
  view, selected, select,
  equipmentGroup, pickEquipment,
  kind,
  exercises, loading, failed, retry: retryExerciseList,
  hasMore, loadingMore, loadMoreFailed, loadMore,
} = useBodyMap()
const { areas, labels, label, pending: musclesPending, failed: musclesFailed, retry } = useMuscleCatalog()
const {
  groups: equipmentGroups,
  label: equipmentLabel,
  pending: equipmentPending,
  failed: equipmentFailed,
  retry: retryEquipmentCatalog,
} = useEquipmentCatalog()
const { hasExercise, addExercise } = useTraining()
const { openPhotos } = useExercisePhotos()

const VIEWS: { key: BodyView, label: string }[] = [{ key: 'front', label: 'Front' }, { key: 'back', label: 'Back' }]
const KINDS: { key: ExerciseKind, label: string }[] = [{ key: 'exercises', label: 'Exercises' }, { key: 'stretches', label: 'Stretches' }]

const { tabindex: kindTabindex, onKeydown: onKindKeydown } = useRadioGroup(KINDS.map(k => k.key), kind)
const isStretches = computed(() => kind.value === 'stretches')

/** Exercises that target the picked muscle, then the ones where it only assists. */
const sections = computed(() => {
  const muscle = selected.value
  if (!muscle) return []
  const name = label(muscle).toLowerCase()
  return [
    { key: 'targets', title: `Targets ${name}`, items: exercises.value.filter(e => e.primary.includes(muscle)) },
    { key: 'assists', title: `Also works ${name}`, items: exercises.value.filter(e => !e.primary.includes(muscle)) },
  ].filter(section => section.items.length)
})

/** Every muscle an exercise trains, primary first, for the card's "Works:" line. */
const worksList = (ex: ExerciseDef) => [
  ...ex.primary.map(muscle => ({ muscle, primary: true })),
  ...ex.secondary.map(muscle => ({ muscle, primary: false })),
]

// On phones the results sit below the figure, so bring them into view after a pick.
const resultsHeading = ref<HTMLElement>()
function pick(muscle: MuscleKey) {
  select(muscle)
  if (matchMedia('(max-width: 767px)').matches) {
    const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches
    nextTick(() => resultsHeading.value?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' }))
  }
}

// Kept on the page so the error block (with its button reading "Retrying…") stays up while a retry runs.
const retrying = ref(false)
async function retryMuscles() {
  retrying.value = true
  try {
    await retry()
  }
  finally {
    retrying.value = false
  }
}

// Same for the equipment tabs. While the error block is up, the results area stays empty instead of showing a wrong message.
const retryingEquipment = ref(false)
const equipmentError = computed(() => equipmentFailed.value || retryingEquipment.value)
async function retryEquipment() {
  retryingEquipment.value = true
  try {
    await retryEquipmentCatalog()
  }
  finally {
    retryingEquipment.value = false
  }
}

const { tabindex: equipmentTabindex, onKeydown: onEquipmentKeydown } = useRadioGroup(() => equipmentGroups.value.map(g => g.key), equipmentGroup)

// Same for the exercise list.
const retryingExercises = ref(false)
async function retryExercises() {
  retryingExercises.value = true
  try {
    await retryExerciseList()
  }
  finally {
    retryingExercises.value = false
  }
}

const adding = ref<string | null>(null)
async function add(def: ExerciseDef) {
  adding.value = def.key
  try {
    await addExercise(def, equipmentLabel(def.equipmentGroup))
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
      <div class="mx-auto w-full max-w-[140px] md:max-w-[240px]">
        <AppBodyFigure :view="view" :selected="selected" :labels="labels" @select="pick" />
      </div>
      <p class="text-[12.5px] text-center" :class="inkFaintCls">Tap a muscle on the body or pick one below.</p>
      <div v-if="musclesFailed || retrying" class="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 py-1" role="alert">
        <span class="text-[13.5px]" :class="inkSoftCls">Couldn't load muscles.</span>
        <button
          type="button"
          class="min-h-11 sm:min-h-8 px-3.5 rounded-[10px] text-[13px] font-semibold bg-ink text-white dark:bg-white dark:text-black disabled:opacity-50"
          :class="focusRingCls"
          :disabled="retrying"
          @click="retryMuscles"
        >
          {{ retrying ? 'Retrying…' : 'Retry' }}
        </button>
      </div>
      <p v-else-if="musclesPending" class="text-[13.5px] text-center py-1" :class="inkFaintCls">Loading muscles…</p>
      <div v-else class="flex flex-col gap-2.5">
        <div v-for="group in areas" :key="group.key" role="group" :aria-label="group.label">
          <div class="text-[11px] font-bold tracking-wide uppercase mb-1" :class="inkFaintCls">{{ group.label }}</div>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="m in group.muscles"
              :key="m.key"
              type="button"
              class="min-h-9 sm:min-h-7 px-2.5 rounded-full text-[12px] font-semibold"
              :class="[focusRingCls, selected === m.key ? 'bg-accent-coral text-white dark:bg-accent-coral-dark' : [bgCls, inkSoftCls]]"
              :aria-pressed="selected === m.key"
              @click="pick(m.key)"
            >
              {{ m.label }}
            </button>
          </div>
        </div>
      </div>
      <p class="text-[11px]" :class="inkFaintCls">
        Body map: <a href="https://github.com/vulovix/body-muscles" target="_blank" rel="noopener" class="underline underline-offset-2">body-muscles</a> by Ivan Vulović (Apache-2.0)
      </p>
    </section>

    <div class="flex flex-col gap-3.5">
      <div class="flex flex-col gap-2.5">
        <h2 ref="resultsHeading" class="text-[20px] font-bold tracking-tight scroll-mt-4" :class="inkCls">
          {{ selected ? label(selected) : 'Find exercises' }}
        </h2>
        <div class="grid grid-cols-2 gap-1 p-1 rounded-[10px] w-full max-w-[280px]" :class="bgCls" role="radiogroup" aria-label="Exercise type" @keydown="onKindKeydown">
          <button
            v-for="k in KINDS"
            :key="k.key"
            type="button"
            role="radio"
            :aria-checked="kind === k.key"
            :tabindex="kindTabindex(k.key)"
            :class="[segmentCls, focusRingCls, kind === k.key ? segmentOnCls : inkSoftCls]"
            @click="kind = k.key"
          >
            {{ k.label }}
          </button>
        </div>
        <template v-if="isStretches" />
        <div v-else-if="equipmentError" class="flex flex-wrap items-center gap-x-3 gap-y-2" role="alert">
          <span class="text-[13.5px]" :class="inkSoftCls">Couldn't load equipment.</span>
          <button
            type="button"
            class="min-h-11 sm:min-h-8 px-3.5 rounded-[10px] text-[13px] font-semibold bg-ink text-white dark:bg-white dark:text-black disabled:opacity-50"
            :class="focusRingCls"
            :disabled="retryingEquipment"
            @click="retryEquipment"
          >
            {{ retryingEquipment ? 'Retrying…' : 'Retry' }}
          </button>
        </div>
        <p v-else-if="equipmentPending" class="text-[13.5px]" :class="inkFaintCls">Loading equipment…</p>
        <div v-else class="flex flex-wrap gap-2" role="radiogroup" aria-label="Equipment" @keydown="onEquipmentKeydown">
          <button
            v-for="group in equipmentGroups"
            :key="group.key"
            type="button"
            role="radio"
            :class="[chipCls, focusRingCls, equipmentGroup === group.key ? chipOnCls : chipOffCls]"
            :aria-checked="equipmentGroup === group.key"
            :tabindex="equipmentTabindex(group.key)"
            @click="pickEquipment(group.key)"
          >
            {{ group.label }}
          </button>
        </div>
      </div>

      <div v-if="!selected" class="rounded-2xl px-5 py-8 shadow-xs text-center" :class="cardCls">
        <div class="text-[15px] font-semibold mb-1" :class="inkCls">Tap a muscle to see {{ kind }}</div>
        <div class="text-[13.5px]" :class="inkSoftCls">{{ isStretches ? 'Add stretches to today\'s workout.' : 'Choose the equipment you have and add exercises to today\'s workout.' }}</div>
      </div>
      <template v-else-if="!isStretches && equipmentError" />
      <div v-else-if="!isStretches && equipmentPending" class="rounded-2xl px-5 py-6 shadow-xs text-[14px]" :class="[cardCls, inkFaintCls]">
        Loading exercises…
      </div>
      <div v-else-if="!isStretches && !equipmentGroup" class="rounded-2xl px-5 py-6 shadow-xs text-[14px]" :class="[cardCls, inkSoftCls]">
        Pick a type of equipment.
      </div>
      <div v-else-if="failed || retryingExercises" class="rounded-2xl px-5 py-6 shadow-xs flex flex-wrap items-center gap-x-3 gap-y-2" :class="cardCls" role="alert">
        <span class="text-[14px]" :class="inkSoftCls">Couldn't load {{ kind }}.</span>
        <button
          type="button"
          class="min-h-11 sm:min-h-8 px-3.5 rounded-[10px] text-[13px] font-semibold bg-ink text-white dark:bg-white dark:text-black disabled:opacity-50"
          :class="focusRingCls"
          :disabled="retryingExercises"
          @click="retryExercises"
        >
          {{ retryingExercises ? 'Retrying…' : 'Retry' }}
        </button>
      </div>
      <div v-else-if="loading" class="rounded-2xl px-5 py-6 shadow-xs text-[14px]" :class="[cardCls, inkFaintCls]">
        Loading {{ kind }}…
      </div>
      <div v-else-if="!exercises.length" class="rounded-2xl px-5 py-6 shadow-xs text-[14px]" :class="[cardCls, inkSoftCls]">
        {{ isStretches ? 'No stretches for this muscle.' : 'No exercises for this filter.' }}
      </div>
      <section v-for="section in sections" v-else :key="section.key" class="flex flex-col gap-2.5">
        <h3 class="text-[13px] font-bold tracking-wide uppercase mt-1" :class="inkFaintCls">{{ section.title }}</h3>
        <ul class="flex flex-col gap-3" :aria-label="section.title">
          <li v-for="ex in section.items" :key="ex.key" class="rounded-2xl px-4 sm:px-5 py-4 shadow-xs flex gap-3.5 sm:gap-4 items-center" :class="cardCls">
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
                <h4 class="text-[15.5px] font-bold" :class="inkCls">{{ ex.name }}</h4>
                <span class="text-[12.5px]" :class="inkFaintCls">{{ equipmentLabel(ex.equipmentGroup) }}</span>
              </div>
              <p v-if="ex.cue" class="text-[13.5px] mt-0.5" :class="inkSoftCls">{{ ex.cue }}</p>
              <p class="text-[12.5px] mt-1.5" :class="inkFaintCls">
                Works:
                <template v-for="(w, i) in worksList(ex)" :key="w.muscle">
                  <span
                    :class="[
                      w.muscle === selected ? ACCENT.coral.icon : w.primary ? inkCls : inkFaintCls,
                      w.primary ? 'font-semibold' : '',
                    ]"
                  >{{ label(w.muscle) }}</span><span v-if="i < worksList(ex).length - 1">, </span>
                </template>
              </p>
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
              :disabled="adding === ex.key"
              :aria-label="`Add ${ex.name} to today's workout`"
              @click="add(ex)"
            >
              + Add
            </button>
          </li>
        </ul>
      </section>
      <div v-if="hasMore && loadMoreFailed" class="flex flex-wrap items-center gap-x-3 gap-y-2" role="alert">
        <span class="text-[13.5px]" :class="inkSoftCls">Couldn't load more exercises.</span>
        <button
          type="button"
          class="min-h-11 sm:min-h-8 px-3.5 rounded-[10px] text-[13px] font-semibold bg-ink text-white dark:bg-white dark:text-black"
          :class="focusRingCls"
          @click="loadMore"
        >
          Retry
        </button>
      </div>
      <button
        v-else-if="hasMore"
        type="button"
        class="min-h-11 sm:min-h-9 px-3.5 rounded-[10px] text-[13px] font-semibold self-start border disabled:opacity-50"
        :class="[dividerCls, inkCls, focusRingCls]"
        :disabled="loadingMore"
        @click="loadMore"
      >
        {{ loadingMore ? 'Loading…' : 'Load more' }}
      </button>
      <NuxtLink v-if="selected" to="/train" class="text-[13.5px] font-semibold self-start" :class="linkBlueCls">See today's workout →</NuxtLink>
    </div>
  </div>
</template>
