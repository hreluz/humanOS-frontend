import type { FoodItem, FoodLogEntry, MealKey } from '~/types/food'
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
const NOW_TICK_MS = 30_000

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

  // When: null means "right now", resolved at submit so an untouched log is always stamped with the real time.
  const now = ref(new Date())
  let nowTimer: ReturnType<typeof setInterval> | undefined
  onMounted(() => {
    nowTimer = setInterval(() => { now.value = new Date() }, NOW_TICK_MS)
  })
  onBeforeUnmount(() => clearInterval(nowTimer))

  const loggedAt = ref<Date | null>(null)
  const at = computed(() => loggedAt.value ?? now.value)
  const days = computed(() => recentDays(now.value))
  const isNow = computed(() => loggedAt.value === null)
  const isToday = computed(() => isSameDay(at.value, now.value))
  // Never later than now: the log is for something that already happened.
  const setWhen = (d: Date) => {
    const current = new Date()
    loggedAt.value = d > current ? current : d
  }
  const whenDay = computed({
    get: () => startOfDay(at.value).getTime(),
    set: (day: number) => setWhen(combineDayTime(new Date(day), toTimeValue(at.value))),
  })
  const whenTime = computed({
    get: () => toTimeValue(at.value),
    set: (hhmm: string) => setWhen(combineDayTime(at.value, hhmm)),
  })
  const resetWhen = () => {
    loggedAt.value = null
    now.value = new Date()
  }

  // Food: a basket of items, each with an amount in the item's unit. Recipes also carry the ingredients of that amount, editable.
  const basket = ref<FoodLogEntry[]>([])
  // The meal follows the chosen time until the user picks one.
  const mealChoice = ref<MealKey | null>(null)
  const meal = computed({
    get: () => mealChoice.value ?? mealForHour(at.value.getHours()),
    set: (m: MealKey) => { mealChoice.value = m },
  })
  const inBasket = (id: string) => basket.value.some(b => b.item.id === id)
  const entryFor = (id: string) => basket.value.find(b => b.item.id === id)

  function toggleFood(item: FoodItem) {
    if (inBasket(item.id)) basket.value = basket.value.filter(b => b.item.id !== item.id)
    else basket.value.push({ item, amount: item.per, ...item.recipe && { ingredients: recipePortion(item, item.per) } })
  }

  /** The recipe's own amount of an ingredient for this entry's servings; undefined if it isn't in the recipe. */
  const recipeAmount = (entry: FoodLogEntry, ingredientId: string) =>
    recipePortion(entry.item, entry.amount).find(i => i.item.id === ingredientId)?.amount

  /** True when the ingredients no longer match the recipe for this many servings. */
  function isEdited(entry: FoodLogEntry) {
    if (!entry.ingredients) return false
    const original = recipePortion(entry.item, entry.amount)
    return original.length !== entry.ingredients.length
      || entry.ingredients.some(i => recipeAmount(entry, i.item.id) !== i.amount)
  }

  // More or fewer servings scale the ingredients too; edits keep their proportions.
  function setFoodAmount(id: string, amount: number) {
    const entry = entryFor(id)
    if (!entry || amount === entry.amount) return
    if (entry.ingredients) {
      const k = amount / entry.amount
      entry.ingredients = isEdited(entry)
        ? entry.ingredients.map(i => ({ item: i.item, amount: Math.round(i.amount * k * 10) / 10 }))
        : recipePortion(entry.item, amount)
    }
    entry.amount = amount
  }

  function stepFood(id: string, dir: 1 | -1) {
    const entry = entryFor(id)
    if (entry) setFoodAmount(id, stepAmount(entry.amount, entry.item.step, dir))
  }

  const ingredientIn = (entryId: string, ingredientId: string) => entryFor(entryId)?.ingredients?.find(i => i.item.id === ingredientId)

  function setIngredientAmount(entryId: string, ingredientId: string, amount: number) {
    const ing = ingredientIn(entryId, ingredientId)
    if (ing) ing.amount = amount
  }

  function stepIngredient(entryId: string, ingredientId: string, dir: 1 | -1) {
    const ing = ingredientIn(entryId, ingredientId)
    if (ing) ing.amount = stepAmount(ing.amount, ing.item.step, dir)
  }

  function removeIngredient(entryId: string, ingredientId: string) {
    const entry = entryFor(entryId)
    if (entry?.ingredients) entry.ingredients = entry.ingredients.filter(i => i.item.id !== ingredientId)
  }

  function resetIngredients(entryId: string) {
    const entry = entryFor(entryId)
    if (entry?.ingredients) entry.ingredients = recipePortion(entry.item, entry.amount)
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
      const sum = basket.value.map(entryMacros).reduce((a, m) => ({ kcal: a.kcal + m.kcal, p: a.p + m.p }), { kcal: 0, p: 0 })
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
    if (!t || !isToday.value) return []
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
    tab.value === 'food' ? basket.value.length > 0 && basket.value.every(b => !b.ingredients || b.ingredients.length > 0) : tab.value === 'activity' ? !!activity.value : waterMl.value > 0
  ))

  const submitLabel = computed(() => {
    if (tab.value === 'food') return `Log ${basket.value.length} item${basket.value.length === 1 ? '' : 's'}`
    if (tab.value === 'activity') return activity.value ? `Log ${activity.value.label.toLowerCase()}` : 'Log activity'
    return `Log ${waterMl.value} ml water`
  })

  async function submit() {
    if (!canSubmit.value) return
    saving.value = true
    const when = (loggedAt.value ?? new Date()).toISOString()
    try {
      if (tab.value === 'food') await addFoods(basket.value, meal.value, when)
      else if (tab.value === 'activity') await logActivity(activityKey.value!, activityAmount.value, kg.value, activityKcal.value, when)
      else await logWater(waterMl.value, when)
      close()
    }
    finally {
      saving.value = false
    }
  }

  return {
    tab, search, saving, kg,
    now, at, days, isNow, isToday, whenDay, whenTime, resetWhen,
    basket, meal, inBasket, toggleFood, stepFood, setFoodAmount,
    recipeAmount, isEdited, setIngredientAmount, stepIngredient, removeIngredient, resetIngredients,
    activityQuery, activityResults, activity, activityAmount, activityKcal, selectActivity, stepActivity,
    estimatedKcal, kcalOverride, kcalModel, stepKcal, resetKcal,
    waterMl, stepWater,
    impact, canSubmit, submitLabel, submit,
  }
}
