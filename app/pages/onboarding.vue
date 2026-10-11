<script setup lang="ts">
definePageMeta({ layout: 'auth' })
useHead({ title: 'Set up · HumanOS' })

const { step, profile, firstName, needsTarget, canSubmit, submitting, next, back } = useOnboarding()
</script>

<template>
  <form class="flex flex-col gap-4" novalidate @submit.prevent="next">
    <div class="flex gap-1.5" aria-hidden="true">
      <div v-for="i in [0, 1]" :key="i" class="h-1 flex-1 rounded-full" :class="i <= step ? 'bg-[#0B0B0C] dark:bg-white' : 'bg-black/10 dark:bg-white/15'" />
    </div>
    <AuthHeading
      :title="step === 0 ? `What's your main goal, ${firstName}?` : 'A few numbers'"
      :subtitle="step === 0 ? 'You can change this later.' : 'Used to set your calorie and protein targets.'"
    >
      <template #eyebrow>
        <div class="text-[12px] font-semibold" :class="inkSoftCls">Step {{ step + 1 }} of 2</div>
      </template>
    </AuthHeading>

    <div v-if="step === 0" class="grid grid-cols-1 sm:grid-cols-2 gap-2.5" role="radiogroup" aria-label="Main goal">
      <button
        v-for="g in ONBOARD_GOALS"
        :key="g.key"
        type="button"
        role="radio"
        :aria-checked="profile.goal === g.key"
        class="rounded-xl p-3.5 border-2 flex sm:flex-col gap-3 sm:gap-2 items-center sm:items-start text-left"
        :class="profile.goal === g.key ? 'border-[#0B0B0C] dark:border-white' : 'border-black/[0.06] dark:border-white/10 hover:border-black/20 dark:hover:border-white/25'"
        @click="profile.goal = g.key"
      >
        <AppIcon :path="g.icon" class="w-5 h-5 shrink-0" :class="inkCls" />
        <div>
          <div class="text-[14px] font-semibold" :class="inkCls">{{ g.label }}</div>
          <div class="text-[12px]" :class="inkSoftCls">{{ g.hint }}</div>
        </div>
      </button>
    </div>

    <template v-else>
      <div class="grid grid-cols-2 gap-3">
        <AuthField v-model="profile.age" label="Age" type="number" placeholder="32" suffix="yrs" />
        <AuthField v-model="profile.height" label="Height" type="number" placeholder="180" suffix="cm" />
        <AuthField v-model="profile.weight" label="Weight" type="number" placeholder="82" suffix="kg" />
        <AuthField v-if="needsTarget" v-model="profile.target" label="Target weight" type="number" :placeholder="profile.goal === 'lose' ? '76' : '86'" suffix="kg" />
      </div>
      <div class="flex flex-col gap-1.5">
        <span class="text-[12.5px] font-semibold" :class="inkSoftCls">Activity level</span>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-1 bg-[#F2F2F7] dark:bg-white/[0.06] rounded-xl p-1" role="radiogroup" aria-label="Activity level">
          <button
            v-for="a in ACTIVITY_LEVELS"
            :key="a"
            type="button"
            role="radio"
            :aria-checked="profile.activity === a"
            class="text-center py-2 rounded-lg text-[12.5px] font-semibold"
            :class="profile.activity === a ? 'bg-[#0B0B0C] text-white dark:bg-white dark:text-black' : inkSoftCls"
            @click="profile.activity = a"
          >
            {{ a }}
          </button>
        </div>
      </div>
    </template>

    <div class="flex gap-2.5 mt-1">
      <button v-if="step === 1" type="button" class="h-11 px-5 rounded-full border border-black/10 dark:border-white/15 text-[14.5px] font-semibold" :class="inkCls" @click="back">Back</button>
      <AuthPrimaryButton :disabled="!canSubmit || submitting">{{ step === 0 ? 'Continue' : 'Start using HumanOS' }}</AuthPrimaryButton>
    </div>
  </form>
</template>
