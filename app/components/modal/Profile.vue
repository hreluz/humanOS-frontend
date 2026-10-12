<script setup lang="ts">
const { close } = useModal()
const { form, errors, formError, valid, saving, save } = useProfileForm()

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
    <form class="flex-1 overflow-auto p-5 flex flex-col gap-4" novalidate @submit.prevent="onSubmit">
      <AuthNotice v-if="formError" tone="error">{{ formError }}</AuthNotice>
      <AppProfileFields v-model="form" :errors="errors" />
      <div class="flex flex-col gap-1.5">
        <span class="text-[12.5px] font-semibold" :class="inkSoftCls">Main goal</span>
        <AppGoalPicker v-model="form.goal" />
      </div>
      <AuthPrimaryButton :disabled="!valid || saving">{{ saving ? 'Saving…' : 'Save changes' }}</AuthPrimaryButton>
    </form>
  </ModalShell>
</template>
