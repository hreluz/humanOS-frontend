<script setup lang="ts">
const route = useRoute()
const { current: modal, isOpen, close } = useModal()

const activeTab = computed(() => route.meta.tab)
const title = computed(() => SCREEN_TITLES[route.meta.tab ?? 'home'])

watch(() => route.fullPath, close)
</script>

<template>
  <div class="w-full h-screen flex overflow-hidden relative" :class="bgCls">
    <AppSidebar :active-tab="activeTab" />

    <div class="flex-1 flex flex-col min-w-0">
      <AppTopBar :title="title" />
      <main class="flex-1 overflow-auto p-4 sm:p-6 md:p-8 pb-24 md:pb-8">
        <slot />
      </main>
    </div>

    <ModalFoodSearch v-if="modal === 'foodSearch'" />
    <ModalRecipe v-else-if="modal === 'recipe'" />
    <ModalPlanner v-else-if="modal === 'planner'" />
    <ModalGrocery v-else-if="modal === 'grocery'" />
    <ModalCoach v-else-if="modal === 'coach'" />
    <ModalProfile v-else-if="modal === 'editProfile'" />
    <ModalWeighIn v-else-if="modal === 'weighIn'" />

    <AppMobileTabBar v-if="!isOpen" :active-tab="activeTab" />
  </div>
</template>
