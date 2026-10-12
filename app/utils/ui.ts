import type { Accent, TabKey } from '~/types/ui'

export const ICONS = {
  coach: 'M12 21s-8-4.5-8-11a5 5 0 019-3 5 5 0 019 3c0 6.5-8 11-8 11z',
  chevronRight: 'M9 5l7 7-7 7',
  search: 'M21 21l-4.3-4.3',
  protein: 'M12 2v20M6 8h12M4 14h16',
  steps: 'M13 3l-8 11h6l-1 7 8-11h-6l1-7z',
  check: 'M5 12l5 5L20 7',
  chevronUp: 'M5 15l7-7 7 7',
  signOut: 'M15 12H4m4-4l-4 4 4 4M14 4h4a2 2 0 012 2v12a2 2 0 01-2 2h-4',
  water: 'M12 2s7 8 7 13a7 7 0 11-14 0c0-5 7-13 7-13z',
  plus: 'M12 5v14M5 12h14',
  scale: 'M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2zM9 10a3 3 0 016 0m-3 0l1.5-2',
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
  blue: { icon: 'text-accent-blue dark:text-accent-blue-dark', track: 'bg-accent-blue-tint dark:bg-accent-blue-dark/20', bar: 'bg-accent-blue dark:bg-accent-blue-dark', iconBg: 'bg-accent-blue-tint dark:bg-accent-blue-dark/20' },
  green: { icon: 'text-accent-green dark:text-accent-green-dark', track: 'bg-accent-green-tint dark:bg-accent-green-dark/20', bar: 'bg-accent-green dark:bg-accent-green-dark', iconBg: 'bg-accent-green-tint dark:bg-accent-green-dark/20' },
  coral: { icon: 'text-accent-coral dark:text-accent-coral-dark', track: 'bg-accent-coral-tint dark:bg-accent-coral-dark/20', bar: 'bg-accent-coral dark:bg-accent-coral-dark', iconBg: 'bg-accent-coral-tint dark:bg-accent-coral-dark/20' },
  amber: { icon: 'text-accent-amber dark:text-accent-amber-dark', track: 'bg-accent-amber-tint dark:bg-white/[0.08]', bar: 'bg-accent-amber dark:bg-accent-amber-dark', iconBg: 'bg-accent-amber-tint dark:bg-white/[0.08]' },
  violet: { icon: 'text-accent-violet dark:text-accent-violet-dark', track: 'bg-accent-violet-tint dark:bg-accent-violet-dark/20', bar: 'bg-accent-violet dark:bg-accent-violet-dark', iconBg: 'bg-accent-violet-tint dark:bg-accent-violet-dark/20' },
}

// Shared design tokens
export const cardCls = 'bg-white dark:bg-surface-dark'
export const inkCls = 'text-ink dark:text-white'
export const inkSoftCls = 'text-black/55 dark:text-white/55'
export const inkFaintCls = 'text-black/40 dark:text-white/40'
export const dividerCls = 'border-black/[0.06] dark:border-white/10'
export const bgCls = 'bg-canvas dark:bg-black'
export const authLinkCls = 'font-semibold text-ink dark:text-white underline underline-offset-2'
export const linkBlueCls = 'text-accent-blue dark:text-accent-blue-dark'
export const focusRingCls = 'outline-none focus-visible:ring-2 focus-visible:ring-ink/40 dark:focus-visible:ring-white/50'
// Segmented control option: 44px tall on touch screens, compact from sm.
export const segmentCls = 'min-h-11 sm:min-h-9 rounded-lg text-[13px] font-semibold'
export const segmentOnCls = 'bg-ink text-white dark:bg-white dark:text-black'
