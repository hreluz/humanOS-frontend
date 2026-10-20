<script setup lang="ts">
definePageMeta({ tab: 'food' })

const route = useRoute()
const { food, pending } = useMyFood(String(route.params.id))
</script>

<template>
  <div class="max-w-[480px] flex flex-col gap-3.5">
    <NuxtLink to="/food/my-foods" class="self-start inline-block py-3 -my-3 text-[13.5px] font-semibold rounded" :class="[linkBlueCls, focusRingCls]">← My foods</NuxtLink>

    <template v-if="!pending">
      <div v-if="food" class="rounded-2xl p-5 shadow-xs flex flex-col gap-4" :class="cardCls">
        <h1 class="text-[20px] font-bold" :class="inkCls">Edit {{ food.name }}</h1>
        <AppIngredientForm :food="food" submit-label="Save changes" @updated="navigateTo('/food/my-foods')" />
      </div>
      <div v-else class="rounded-2xl px-5 py-8 shadow-xs flex flex-col items-center gap-3" :class="cardCls">
        <p class="text-[14.5px]" :class="inkSoftCls">This food doesn't exist anymore.</p>
        <NuxtLink to="/food/my-foods" class="text-[13.5px] font-semibold rounded" :class="[linkBlueCls, focusRingCls]">Back to My foods</NuxtLink>
      </div>
    </template>
  </div>
</template>
