const pad = (n: number) => String(n).padStart(2, '0')

/** Monday of the week containing `date`, as a local YYYY-MM-DD string. */
export function weekStart(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** "2026-07-06" → "Jul 6". */
export function formatWeek(week: string) {
  const [y, m, d] = week.split('-').map(Number)
  return new Date(y!, m! - 1, d!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
