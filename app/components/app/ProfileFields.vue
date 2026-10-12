<script setup lang="ts">
import type { FieldErrors } from '~/types/auth'
import type { ProfileForm, UnitSystem } from '~/types/profile'

defineProps<{ errors?: FieldErrors }>()
const form = defineModel<ProfileForm>({ required: true })

const imperial = computed(() => form.value.unitSystem === 'imperial')
const unit = computed(() => weightUnit(form.value.unitSystem))
const needsTarget = computed(() => goalNeedsTarget(form.value.goal))
const targetPlaceholder = computed(() => {
  const lose = form.value.goal === 'lose'
  if (imperial.value) return lose ? '168' : '190'
  return lose ? '76' : '86'
})
// The toggle converts the values already typed instead of making the user retype them.
const unitSystem = computed({
  get: () => form.value.unitSystem,
  set: (to: UnitSystem) => convertProfileForm(form.value, to),
})

// The API accepts ages 13–120; the picker only rules out the future and >120 years, the API message covers the rest.
const pad = (n: number) => String(n).padStart(2, '0')
const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const today = new Date()
const maxBirthDate = isoDate(today)
const minBirthDate = isoDate(new Date(today.getFullYear() - 120, today.getMonth(), today.getDate()))
</script>

<template>
  <div class="flex flex-col gap-4">
    <AppUnitToggle v-model="unitSystem" />
    <div class="grid grid-cols-2 gap-3">
      <AuthField v-model="form.birthDate" label="Birth date" type="date" autocomplete="bday" :min="minBirthDate" :max="maxBirthDate" :error="errors?.birthDate" />
      <AppSexPicker v-model="form.sex" :error="errors?.sex" />
    </div>
    <!-- Imperial height is one measurement typed in two boxes, so it gets one label. -->
    <fieldset v-if="imperial" class="min-w-0">
      <legend class="mb-1.5 text-[12.5px] font-semibold" :class="inkSoftCls">Height</legend>
      <div class="grid grid-cols-2 gap-3">
        <AuthField v-model="form.heightFt" label="Height, feet" hide-label type="number" placeholder="5" suffix="ft" :error="errors?.heightFt" />
        <AuthField v-model="form.heightIn" label="Height, inches" hide-label type="number" placeholder="11" suffix="in" />
      </div>
    </fieldset>
    <AuthField v-else v-model="form.heightCm" label="Height" type="number" placeholder="180" suffix="cm" :error="errors?.heightCm" />
    <div class="grid grid-cols-2 gap-3">
      <AuthField v-model="form.weight" label="Weight" type="number" :placeholder="imperial ? '180' : '82'" :suffix="unit" :error="errors?.weight" />
      <AuthField v-if="needsTarget" v-model="form.target" label="Target weight" type="number" :placeholder="targetPlaceholder" :suffix="unit" :error="errors?.target" />
    </div>
    <AppActivityPicker v-model="form.activityLevel" :error="errors?.activityLevel" />
  </div>
</template>
