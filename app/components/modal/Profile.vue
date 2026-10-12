<script setup lang="ts">
const { close } = useModal()
const { form, errors, formError, missingHint, valid, saving, save } = useProfileForm()
const hintId = useId()

async function onSubmit() {
  if (await save()) close()
}
</script>

<template>
  <ModalShell label="Edit profile" panel-class="md:w-[520px] max-h-[90vh] md:max-h-[720px]">
    <div class="p-5 border-b flex items-center justify-between" :class="dividerCls">
      <span class="text-base font-bold" :class="inkCls">Edit profile</span>
      <ModalCloseButton />
    </div>
    <!-- Fields scroll; the Save footer stays visible. -->
    <form class="flex-1 min-h-0 flex flex-col" novalidate @submit.prevent="onSubmit">
      <div class="flex-1 overflow-auto p-5 flex flex-col gap-4">
        <AuthNotice v-if="formError" tone="error">{{ formError }}</AuthNotice>
        <!-- First: the goal decides whether a target weight is asked for. -->
        <div class="flex flex-col gap-1.5">
          <span class="text-[12.5px] font-semibold" :class="inkSoftCls">Main goal</span>
          <AppGoalPicker v-model="form.goal" />
        </div>
        <AppProfileFields v-model="form" :errors="errors" />
      </div>
      <div class="relative px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] flex flex-col gap-2" :class="cardCls">
        <!-- Fields fade out under the bar instead of being cut by a line. -->
        <div aria-hidden="true" class="pointer-events-none absolute inset-x-0 bottom-full h-6 bg-linear-to-t from-white dark:from-surface-dark to-transparent" />
        <div class="flex flex-col sm:flex-row sm:justify-end sm:items-center gap-2">
          <!-- Phones close from the header; the full-width Save stays in thumb reach. -->
          <button type="button" class="hidden sm:inline-flex items-center h-11 px-5 rounded-full text-[14.5px] font-semibold hover:bg-black/5 dark:hover:bg-white/10" :class="[inkSoftCls, focusRingCls]" @click="close">Cancel</button>
          <AuthPrimaryButton class="sm:w-auto sm:px-6" :disabled="!valid || saving" :aria-describedby="missingHint ? hintId : undefined">{{ saving ? 'Saving…' : 'Save changes' }}</AuthPrimaryButton>
        </div>
        <p v-if="missingHint" :id="hintId" class="text-[12.5px] text-center sm:text-right" :class="inkSoftCls" aria-live="polite">{{ missingHint }}</p>
      </div>
    </form>
  </ModalShell>
</template>
