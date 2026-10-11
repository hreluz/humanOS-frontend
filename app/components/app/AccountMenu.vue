<script setup lang="ts">
const { userName, initial, goalLabel, signOut, signingOut } = useAuth()
const route = useRoute()

const PROFILE_ICON = NAV_DEFS.find(nav => nav.key === 'profile')!.icon
const menuId = useId()
const open = ref(false)
const root = useTemplateRef<HTMLElement>('root')
const trigger = useTemplateRef<HTMLButtonElement>('trigger')

function close(refocus = false) {
  open.value = false
  if (refocus) trigger.value?.focus()
}

function onPointerDown(e: PointerEvent) {
  if (open.value && !root.value?.contains(e.target as Node)) close()
}

function onFocusOut(e: FocusEvent) {
  if (!root.value?.contains(e.relatedTarget as Node | null)) close()
}

onMounted(() => document.addEventListener('pointerdown', onPointerDown))
onBeforeUnmount(() => document.removeEventListener('pointerdown', onPointerDown))
watch(() => route.fullPath, () => close())

const itemCls = 'w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] font-medium text-left outline-none focus-visible:ring-2 focus-visible:ring-ink/40 dark:focus-visible:ring-white/50'
</script>

<template>
  <div ref="root" class="relative" @focusout="onFocusOut" @keydown.esc="close(true)">
    <div
      v-if="open"
      :id="menuId"
      role="menu"
      aria-label="Account"
      class="absolute bottom-full inset-x-0 mb-2 p-1.5 rounded-2xl border shadow-lg"
      :class="[cardCls, dividerCls]"
    >
      <NuxtLink to="/profile" role="menuitem" :class="[itemCls, inkCls]" class="hover:bg-black/5 dark:hover:bg-white/10">
        <AppIcon :path="PROFILE_ICON" class="w-[18px] h-[18px]" :class="inkFaintCls" />
        Profile
      </NuxtLink>
      <button
        type="button"
        role="menuitem"
        :class="itemCls"
        class="text-accent-coral-strong dark:text-accent-coral-dark hover:bg-accent-coral/10 disabled:opacity-60"
        :disabled="signingOut"
        @click="signOut"
      >
        <AppIcon :path="ICONS.signOut" class="w-[18px] h-[18px]" />
        {{ signingOut ? 'Signing out…' : 'Sign out' }}
      </button>
    </div>

    <button
      ref="trigger"
      type="button"
      aria-haspopup="menu"
      :aria-expanded="open"
      :aria-controls="open ? menuId : undefined"
      class="w-full flex items-center gap-2.5 p-2 rounded-[10px] text-left outline-none hover:bg-black/5 dark:hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-ink/40 dark:focus-visible:ring-white/50"
      :class="open ? bgCls : ''"
      @click="open = !open"
    >
      <div class="w-[30px] h-[30px] rounded-full bg-ink flex items-center justify-center text-white text-[13px] font-semibold shrink-0">{{ initial }}</div>
      <div class="flex-1 min-w-0">
        <div class="text-[13.5px] font-semibold truncate" :class="inkCls">{{ userName }}</div>
        <div class="text-[11.5px]" :class="inkFaintCls">{{ goalLabel }}</div>
      </div>
      <AppIcon :path="ICONS.chevronUp" class="w-4 h-4 shrink-0" :class="[inkFaintCls, open ? '' : 'rotate-180']" />
    </button>
  </div>
</template>
