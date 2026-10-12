<script setup lang="ts">
definePageMeta({ layout: 'auth' })
useHead({ title: 'Set up · HumanOS' })

const { step, form, errors, formError, firstName, goalOnly, canSubmit, submitting, next, back } = useOnboarding()
</script>

<template>
  <form class="flex flex-col gap-4" novalidate @submit.prevent="next">
    <div v-if="!goalOnly" class="flex gap-1.5" aria-hidden="true">
      <div v-for="i in [0, 1]" :key="i" class="h-1 flex-1 rounded-full" :class="i <= step ? 'bg-ink dark:bg-white' : 'bg-black/10 dark:bg-white/15'" />
    </div>
    <AuthHeading
      :title="step === 0 ? `What's your main goal, ${firstName}?` : 'A few numbers'"
      :subtitle="step === 0 ? 'You can change this later.' : 'Used to set your calorie and protein targets.'"
    >
      <template v-if="!goalOnly" #eyebrow>
        <div class="text-[12px] font-semibold" :class="inkSoftCls">Step {{ step + 1 }} of 2</div>
      </template>
    </AuthHeading>

    <AppGoalPicker v-if="step === 0" v-model="form.goal" />

    <template v-else>
      <AuthNotice v-if="formError" tone="error">{{ formError }}</AuthNotice>
      <AppProfileFields v-model="form" :errors="errors" />
    </template>

    <div class="flex gap-2.5 mt-1">
      <button v-if="step === 1" type="button" class="h-11 px-5 rounded-full border border-black/10 dark:border-white/15 text-[14.5px] font-semibold" :class="inkCls" @click="back">Back</button>
      <AuthPrimaryButton :disabled="!canSubmit || submitting">{{ step === 0 ? 'Continue' : 'Start using HumanOS' }}</AuthPrimaryButton>
    </div>
  </form>
</template>
