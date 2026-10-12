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
</script>

<template>
  <div class="flex flex-col gap-4">
    <AppUnitToggle v-model="unitSystem" />
    <div class="grid grid-cols-2 gap-3">
      <AuthField v-model="form.birthDate" label="Birth date" type="date" autocomplete="bday" :error="errors?.birthDate" />
      <AppSexPicker v-model="form.sex" :error="errors?.sex" />
      <template v-if="imperial">
        <AuthField v-model="form.heightFt" label="Height (ft)" type="number" placeholder="5" suffix="ft" :error="errors?.heightFt" />
        <AuthField v-model="form.heightIn" label="Height (in)" type="number" placeholder="11" suffix="in" />
      </template>
      <AuthField v-else v-model="form.heightCm" label="Height" type="number" placeholder="180" suffix="cm" :error="errors?.heightCm" />
      <AuthField v-model="form.weight" label="Weight" type="number" :placeholder="imperial ? '180' : '82'" :suffix="unit" :error="errors?.weight" />
      <AuthField v-if="needsTarget" v-model="form.target" label="Target weight" type="number" :placeholder="targetPlaceholder" :suffix="unit" :error="errors?.target" />
    </div>
    <AppActivityPicker v-model="form.activityLevel" :error="errors?.activityLevel" />
  </div>
</template>
