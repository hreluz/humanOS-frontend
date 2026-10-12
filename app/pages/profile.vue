<script setup lang="ts">
definePageMeta({ tab: 'profile' })

const { user, profile, userName, initial, goalLabel, signOut, signingOut } = useAuth()
const { targets } = useFoodLog()
const { latest, unit, target, load } = useWeighIns()
const { open } = useModal()
useAsyncData('load:weight-entries', () => load().then(() => true))

const capitalize = (s: string) => s[0]!.toUpperCase() + s.slice(1)

const about = computed(() => {
  const p = profile.value
  if (!p) return []
  return [
    { label: 'Goal', value: goalLabel.value },
    { label: 'Age', value: String(p.age) },
    { label: 'Sex', value: capitalize(p.sex) },
    { label: 'Weight', value: p.weight !== null ? `${p.weight} ${unit.value}` : '—', note: latest.value ? `Logged ${formatWeek(latest.value.week)}` : undefined },
    ...(target.value !== null ? [{ label: 'Target weight', value: `${target.value} ${unit.value}` }] : []),
    { label: 'Height', value: formatHeight(p) },
    { label: 'Activity', value: ACTIVITY_LEVELS.find(a => a.value === p.activityLevel)?.label ?? '—' },
    { label: 'Units', value: capitalize(p.unitSystem) },
  ]
})
</script>

<template>
  <div v-if="user" class="max-w-[560px]">
    <div class="flex items-center gap-4 mb-6">
      <div class="w-16 h-16 rounded-full bg-ink flex items-center justify-center text-white text-2xl font-semibold shrink-0">{{ initial }}</div>
      <div class="min-w-0">
        <div class="text-xl font-bold truncate" :class="inkCls">{{ userName }}</div>
        <div class="text-sm truncate" :class="inkFaintCls">{{ user.email }}</div>
      </div>
    </div>
    <div class="flex items-baseline justify-between mb-2">
      <h2 class="text-xs font-bold tracking-wide uppercase" :class="inkFaintCls">About you</h2>
      <button type="button" class="text-[13.5px] font-semibold" :class="linkBlueCls" aria-label="Edit profile" @click="open('editProfile')">Edit</button>
    </div>
    <div class="rounded-2xl overflow-hidden shadow-xs mb-6" :class="cardCls">
      <div v-for="(row, i) in about" :key="row.label" class="flex justify-between items-baseline gap-3 px-[18px] py-3.5" :class="i < about.length - 1 ? ['border-b', dividerCls] : ''">
        <span class="text-[14.5px]" :class="inkSoftCls">{{ row.label }}</span>
        <span class="text-right">
          <span v-if="row.note" class="text-[12.5px] mr-2" :class="inkFaintCls">{{ row.note }}</span>
          <span class="text-[14.5px] font-semibold" :class="inkCls">{{ row.value }}</span>
        </span>
      </div>
    </div>
    <h2 class="text-xs font-bold tracking-wide uppercase mb-2" :class="inkFaintCls">Daily targets</h2>
    <div v-if="targets" class="rounded-2xl overflow-hidden shadow-xs" :class="cardCls">
      <div class="flex justify-between px-[18px] py-3.5 border-b" :class="dividerCls"><span class="text-[14.5px]" :class="inkSoftCls">Calories</span><span class="text-[14.5px] font-semibold" :class="inkCls">{{ targets.kcal.toLocaleString('en-US') }} kcal</span></div>
      <div class="flex justify-between px-[18px] py-3.5"><span class="text-[14.5px]" :class="inkSoftCls">Protein</span><span class="text-[14.5px] font-semibold" :class="inkCls">{{ targets.protein }} g</span></div>
    </div>
    <button type="button" class="mt-6 w-full h-11 rounded-full shadow-xs text-[14.5px] font-semibold text-accent-coral dark:text-accent-coral-dark hover:opacity-80 disabled:opacity-60 disabled:hover:opacity-60" :class="cardCls" :disabled="signingOut" @click="signOut">{{ signingOut ? 'Signing out…' : 'Sign out' }}</button>
  </div>
</template>
