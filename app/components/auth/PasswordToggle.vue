<script setup lang="ts">
const shown = defineModel<boolean>({ required: true })
</script>

<template>
  <button
    type="button"
    class="select-none font-semibold"
    :aria-label="shown ? 'Hide password' : 'Show password'"
    @click="shown = !shown"
  >
    {{ shown ? 'Hide' : 'Show' }}
  </button>
</template>
