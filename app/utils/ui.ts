import type { Accent, TabKey } from '~/types/ui'

export const ICONS = {
  coach: 'M12 21s-8-4.5-8-11a5 5 0 019-3 5 5 0 019 3c0 6.5-8 11-8 11z',
  chevronRight: 'M9 5l7 7-7 7',
  search: 'M21 21l-4.3-4.3',
  protein: 'M12 2v20M6 8h12M4 14h16',
  steps: 'M13 3l-8 11h6l-1 7 8-11h-6l1-7z',
  check: 'M5 12l5 5L20 7',
}

export const NAV_DEFS: { key: TabKey, label: string, to: string, icon: string }[] = [
  { key: 'home', label: 'Home', to: '/', icon: 'M4 11l8-7 8 7v9a2 2 0 01-2 2H6a2 2 0 01-2-2z' },
  { key: 'food', label: 'Food', to: '/food', icon: 'M12 2v20M6 8h12M4 14h16' },
  { key: 'train', label: 'Train', to: '/train', icon: 'M4 12h4m8 0h4M8 8v8m8-8v8' },
  { key: 'stats', label: 'Stats', to: '/stats', icon: 'M4 20V10m6 10V4m6 16v-7' },
  { key: 'goals', label: 'Goals', to: '/goals', icon: 'M12 2v6m0 8v6m10-10h-6M8 12H2' },
  { key: 'profile', label: 'Profile', to: '/profile', icon: 'M20 21a8 8 0 10-16 0M12 11a4 4 0 100-8 4 4 0 000 8z' },
]

export const SCREEN_TITLES: Record<TabKey, string> = {
  home: 'Home', food: 'Food', train: 'Training', stats: 'Stats', goals: 'Goals',
  profile: 'Profile', weeklyReview: 'Weekly Review',
}

// Accent -> tailwind class groups (light / dark handled via dark: variants)
export const ACCENT: Record<Accent, { icon: string, track: string, bar: string, iconBg: string }> = {
  blue: { icon: 'text-[#2F6FED] dark:text-[#4C8DFF]', track: 'bg-[#E7EEFC] dark:bg-[#4C8DFF]/20', bar: 'bg-[#2F6FED] dark:bg-[#4C8DFF]', iconBg: 'bg-[#E7EEFC] dark:bg-[#4C8DFF]/20' },
  green: { icon: 'text-[#33C463] dark:text-[#32D74B]', track: 'bg-[#E5F6EC] dark:bg-[#32D74B]/20', bar: 'bg-[#33C463] dark:bg-[#32D74B]', iconBg: 'bg-[#E5F6EC] dark:bg-[#32D74B]/20' },
  coral: { icon: 'text-[#FF6B4A] dark:text-[#FF7A5C]', track: 'bg-[#FDEEE9] dark:bg-[#FF7A5C]/20', bar: 'bg-[#FF6B4A] dark:bg-[#FF7A5C]', iconBg: 'bg-[#FDEEE9] dark:bg-[#FF7A5C]/20' },
  amber: { icon: 'text-[#F5A623] dark:text-[#FFB340]', track: 'bg-[#FDF3E2] dark:bg-white/[0.08]', bar: 'bg-[#F5A623] dark:bg-[#FFB340]', iconBg: 'bg-[#FDF3E2] dark:bg-white/[0.08]' },
  violet: { icon: 'text-[#9B6BFF] dark:text-[#BF6BFF]', track: 'bg-[#F3EBFD] dark:bg-[#BF6BFF]/20', bar: 'bg-[#9B6BFF] dark:bg-[#BF6BFF]', iconBg: 'bg-[#F3EBFD] dark:bg-[#BF6BFF]/20' },
}

// Shared design tokens
export const cardCls = 'bg-white dark:bg-[#1C1C1E]'
export const inkCls = 'text-[#0B0B0C] dark:text-white'
export const inkSoftCls = 'text-black/55 dark:text-white/55'
export const inkFaintCls = 'text-black/40 dark:text-white/40'
export const dividerCls = 'border-black/[0.06] dark:border-white/10'
export const bgCls = 'bg-[#F2F2F7] dark:bg-black'
export const linkBlueCls = 'text-[#2F6FED] dark:text-[#4C8DFF]'
