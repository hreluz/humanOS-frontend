<script setup lang="ts">
const { close } = useModal()
</script>

<template>
  <button type="button" class="text-[13.5px] font-semibold" :class="inkFaintCls" @click="close">Close</button>
</template>
