<script setup lang="ts">
const { close } = useModal()
const { form, needsTarget, valid, saving, save } = useProfileForm()

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
      <div class="grid grid-cols-2 gap-3">
        <AuthField v-model="form.weight" label="Current weight" type="number" placeholder="82" suffix="kg" />
        <AuthField v-if="needsTarget" v-model="form.target" label="Target weight" type="number" :placeholder="form.goal === 'lose' ? '76' : '86'" suffix="kg" />
        <AuthField v-model="form.height" label="Height" type="number" placeholder="180" suffix="cm" />
        <AuthField v-model="form.age" label="Age" type="number" placeholder="32" suffix="yrs" />
      </div>
      <AppActivityPicker v-model="form.activity" />
      <div class="flex flex-col gap-1.5">
        <span class="text-[12.5px] font-semibold" :class="inkSoftCls">Main goal</span>
        <AppGoalPicker v-model="form.goal" />
      </div>
      <AuthPrimaryButton :disabled="!valid || saving">{{ saving ? 'Saving…' : 'Save changes' }}</AuthPrimaryButton>
    </form>
  </ModalShell>
</template>
