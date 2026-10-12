import type { FoodItem, MealKey } from '~/types/food'
import * as activityService from '~/services/activityService'

export type QuickLogTab = 'food' | 'activity' | 'water'

export const QUICK_LOG_TABS: { key: QuickLogTab, label: string }[] = [
  { key: 'food', label: 'Food' },
  { key: 'activity', label: 'Activity' },
  { key: 'water', label: 'Water' },
]

export const MEAL_OPTIONS: { key: MealKey, label: string }[] = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'snacks', label: 'Snacks' },
]

export const WATER_PRESETS = [250, 500, 750]
const WATER_STEP = 50
const KCAL_STEP = 10
const FALLBACK_KG = 75

/** Opens the quick log on a tab; usable anywhere without loading the sheet's data. */
export function useQuickLogLauncher() {
  const tab = useState<QuickLogTab>('quick-log-tab', () => 'food')
  const { open } = useModal()
  function openQuickLog(to?: QuickLogTab) {
    if (to) tab.value = to
    open('quickLog')
  }
  return { tab, openQuickLog }
}

export function useQuickLog() {
  const { tab } = useQuickLogLauncher()
  const { close } = useModal()
  const { profile } = useAuth()
  const { addFoods } = useFoodLog()
  const { logActivity, logWater } = useTodayActivity()
  const { goals } = useGoals()
  const { totals } = useToday()
  const { state: activities } = useServiceState('activities', activityService.getActivities)
  const search = useFoodSearch()
  const saving = ref(false)

  const kg = computed(() => profile.value?.weightKg ?? FALLBACK_KG)

  // Food: a basket of items, each with an amount in the item's unit.
  const basket = ref<{ item: FoodItem, amount: number }[]>([])
  const meal = ref<MealKey>(mealForHour(new Date().getHours()))
  const inBasket = (id: string) => basket.value.some(b => b.item.id === id)

  function toggleFood(item: FoodItem) {
    if (inBasket(item.id)) basket.value = basket.value.filter(b => b.item.id !== item.id)
    else basket.value.push({ item, amount: item.per })
  }

  function stepFood(id: string, dir: 1 | -1) {
    const entry = basket.value.find(b => b.item.id === id)
    if (entry) entry.amount = stepAmount(entry.amount, entry.item.step, dir)
  }

  // Activity: one at a time, minutes or steps.
  const activityQuery = ref('')
  const activityKey = ref<string | null>(null)
  const activityAmount = ref(0)
  const activityResults = computed(() => {
    const q = activityQuery.value.trim().toLowerCase()
    return (activities.value ?? []).filter(a => a.label.toLowerCase().includes(q))
  })
  const activity = computed(() => activities.value?.find(a => a.key === activityKey.value) ?? null)
  const estimatedKcal = computed(() => activity.value ? burnedKcal(activity.value, activityAmount.value, kg.value) : 0)
  // Set when the user types or steps the calories (e.g. walking uphill, or a watch's number); pinned until cleared.
  const kcalOverride = ref<number | null>(null)
  const activityKcal = computed(() => kcalOverride.value ?? estimatedKcal.value)
  const kcalModel = computed({
    get: () => activityKcal.value,
    set: (v: number) => { kcalOverride.value = v },
  })
  const stepKcal = (dir: 1 | -1) => { kcalOverride.value = stepAmount(activityKcal.value, KCAL_STEP, dir) }
  const resetKcal = () => { kcalOverride.value = null }

  function selectActivity(key: string) {
    const def = activities.value?.find(a => a.key === key)
    if (!def) return
    activityKey.value = key
    activityAmount.value = def.defaultAmount
    kcalOverride.value = null
  }

  function stepActivity(dir: 1 | -1) {
    if (activity.value) activityAmount.value = stepAmount(activityAmount.value, activity.value.step, dir)
  }

  // Water
  const waterMl = ref(WATER_PRESETS[0]!)
  const stepWater = (dir: 1 | -1) => { waterMl.value = stepAmount(waterMl.value, WATER_STEP, dir) }

  /** What saving would add to each daily metric. */
  const delta = computed<Partial<DailyTotals>>(() => {
    if (tab.value === 'food') {
      const sum = basket.value.map(b => scaleFood(b.item, b.amount)).reduce((a, m) => ({ kcal: a.kcal + m.kcal, p: a.p + m.p }), { kcal: 0, p: 0 })
      return { kcal: sum.kcal, protein: sum.p }
    }
    if (tab.value === 'activity') {
      if (!activity.value) return {}
      return { activeKcal: activityKcal.value, steps: activity.value.unit === 'steps' ? activityAmount.value : 0 }
    }
    return { waterMl: waterMl.value }
  })

  /** Each daily goal this log moves: where it is now and where it lands. */
  const impact = computed(() => {
    const t = totals.value
    if (!t) return []
    return (goals.value ?? []).flatMap((g) => {
      const add = g.metric && g.target ? delta.value[g.metric] ?? 0 : 0
      if (!g.metric || !g.target || add <= 0) return []
      const from = t[g.metric]
      const fromPct = metricPct(from, g.target)
      return [{
        id: g.id,
        label: METRIC_LABELS[g.metric],
        accent: g.accent,
        change: `${formatMetric(g.metric, from)} → ${formatMetric(g.metric, from + add)} of ${formatMetric(g.metric, g.target)}`,
        pct: fromPct,
        addPct: metricPct(from + add, g.target) - fromPct,
      }]
    })
  })

  const canSubmit = computed(() => !saving.value && (
    tab.value === 'food' ? basket.value.length > 0 : tab.value === 'activity' ? !!activity.value : waterMl.value > 0
  ))

  const submitLabel = computed(() => {
    if (tab.value === 'food') return `Log ${basket.value.length} item${basket.value.length === 1 ? '' : 's'}`
    if (tab.value === 'activity') return activity.value ? `Log ${activity.value.label.toLowerCase()}` : 'Log activity'
    return `Log ${waterMl.value} ml water`
  })

  async function submit() {
    if (!canSubmit.value) return
    saving.value = true
    try {
      if (tab.value === 'food') await addFoods(basket.value, meal.value)
      else if (tab.value === 'activity') await logActivity(activityKey.value!, activityAmount.value, kg.value, activityKcal.value)
      else await logWater(waterMl.value)
      close()
    }
    finally {
      saving.value = false
    }
  }

  return {
    tab, search, saving, kg,
    basket, meal, inBasket, toggleFood, stepFood,
    activityQuery, activityResults, activity, activityAmount, activityKcal, selectActivity, stepActivity,
    estimatedKcal, kcalOverride, kcalModel, stepKcal, resetKcal,
    waterMl, stepWater,
    impact, canSubmit, submitLabel, submit,
  }
}
