<script setup lang="ts">
definePageMeta({ tab: 'profile' })

const { user, userName, initial, goalLabel, signOut } = useAuth()
const { targets } = useFoodLog()

const about = computed(() => {
  const u = user.value
  if (!u) return []
  return [
    ['Goal', goalLabel.value],
    ['Weight', u.weight ? u.weight + ' kg' : '—'],
    ...(u.target && goalNeedsTarget(u.goal) ? [['Target weight', u.target + ' kg']] : []),
    ['Height', u.height ? u.height + ' cm' : '—'],
    ['Activity', u.activity || '—'],
  ]
})
</script>

<template>
  <div v-if="user" class="max-w-[560px]">
    <div class="flex items-center gap-4 mb-6">
      <div class="w-16 h-16 rounded-full bg-[#0B0B0C] flex items-center justify-center text-white text-2xl font-semibold shrink-0">{{ initial }}</div>
      <div class="min-w-0">
        <div class="text-xl font-bold truncate" :class="inkCls">{{ userName }}</div>
        <div class="text-sm truncate" :class="inkFaintCls">{{ user.email }}</div>
      </div>
    </div>
    <h2 class="text-xs font-bold tracking-wide uppercase mb-2" :class="inkFaintCls">About you</h2>
    <div class="rounded-2xl overflow-hidden shadow-xs mb-6" :class="cardCls">
      <div v-for="([k, v], i) in about" :key="k" class="flex justify-between px-[18px] py-3.5" :class="i < about.length - 1 ? ['border-b', dividerCls] : ''">
        <span class="text-[14.5px]" :class="inkSoftCls">{{ k }}</span>
        <span class="text-[14.5px] font-semibold" :class="inkCls">{{ v }}</span>
      </div>
    </div>
    <h2 class="text-xs font-bold tracking-wide uppercase mb-2" :class="inkFaintCls">Daily targets</h2>
    <div v-if="targets" class="rounded-2xl overflow-hidden shadow-xs" :class="cardCls">
      <div class="flex justify-between px-[18px] py-3.5 border-b" :class="dividerCls"><span class="text-[14.5px]" :class="inkSoftCls">Calories</span><span class="text-[14.5px] font-semibold" :class="inkCls">{{ targets.kcal.toLocaleString('en-US') }} kcal</span></div>
      <div class="flex justify-between px-[18px] py-3.5"><span class="text-[14.5px]" :class="inkSoftCls">Protein</span><span class="text-[14.5px] font-semibold" :class="inkCls">{{ targets.protein }} g</span></div>
    </div>
    <button type="button" class="mt-6 w-full h-11 rounded-full shadow-xs text-[14.5px] font-semibold text-[#FF6B4A] dark:text-[#FF7A5C] hover:opacity-80" :class="cardCls" @click="signOut">Sign out</button>
  </div>
</template>
