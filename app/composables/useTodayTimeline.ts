import type { Accent } from '~/types/ui'

export interface TimelineEntry {
  id: string
  loggedAt: string
  label: string
  detail: string
  icon: string
  accent: Accent
}

/** Everything logged by hand today, newest first. */
export function useTodayTimeline() {
  const { mealSections } = useFoodLog()
  const { log } = useTodayActivity()

  const entries = computed<TimelineEntry[]>(() => {
    const foods = mealSections.value.flatMap(m => m.items
      .filter(i => i.loggedAt)
      .map((i, n) => ({
        id: `${m.key}_${n}_${i.loggedAt}`,
        loggedAt: i.loggedAt!,
        label: i.name,
        detail: [i.portion, `${i.kcal} kcal`, m.label].filter(Boolean).join(' · '),
        icon: ICONS.protein,
        accent: 'coral' as const,
      })))
    const activity = log.value.map(e => ({
      id: e.id,
      loggedAt: e.loggedAt,
      label: e.label,
      detail: e.kind === 'water' ? formatActivityAmount('ml', e.amount) : `${formatActivityAmount(e.unit, e.amount)} · ${e.kcal} kcal burned`,
      icon: e.icon,
      accent: (e.kind === 'water' ? 'blue' : 'green') as Accent,
    }))
    return [...foods, ...activity].sort((a, b) => b.loggedAt.localeCompare(a.loggedAt))
  })

  return { entries }
}
