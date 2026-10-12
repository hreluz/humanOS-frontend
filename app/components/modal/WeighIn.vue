<script setup lang="ts">
const { close } = useModal()
const { profile } = useAuth()
const { latest, loggedThisWeek, previous, unit, saving, logWeighIn } = useWeighIns()

// Compare against the last entry before this week, so re-logging this week still shows last week.
const lastWeek = computed(() => loggedThisWeek.value ? previous.value : latest.value)
const weight = ref(String(latest.value?.weight ?? profile.value?.weight ?? ''))
const valid = computed(() => +weight.value > 0)

async function onSubmit() {
  if (!valid.value) return
  await logWeighIn(Math.round(+weight.value * 10) / 10)
  close()
}
</script>

<template>
  <ModalShell label="Log this week's weight" panel-class="md:w-[440px] max-h-[85vh]">
    <div class="p-5 border-b flex items-center justify-between" :class="dividerCls">
      <span class="text-base font-bold" :class="inkCls">{{ loggedThisWeek ? "Update this week's weight" : "Log this week's weight" }}</span>
      <ModalCloseButton />
    </div>
    <form class="p-5 flex flex-col gap-4" novalidate @submit.prevent="onSubmit">
      <AuthField v-model="weight" label="Weight" type="number" :placeholder="unit === 'lb' ? '180' : '82'" :suffix="unit" />
      <div v-if="lastWeek" class="text-[13px] -mt-2" :class="inkFaintCls">Last weigh-in: {{ lastWeek.weight }} {{ unit }} on {{ formatWeek(lastWeek.week) }}</div>
      <AuthPrimaryButton :disabled="!valid || saving">{{ saving ? 'Saving…' : 'Save weigh-in' }}</AuthPrimaryButton>
    </form>
  </ModalShell>
</template>
