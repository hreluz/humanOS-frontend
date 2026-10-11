import * as goalService from '~/services/goalService'

export function useGoals() {
  const { state: goals, pending } = useServiceState('goals', goalService.getGoals)
  return { goals, pending }
}

export function useNewGoal() {
  const { goals } = useGoals()
  const { state: templates } = useServiceState('goal-templates', goalService.getGoalTemplates)
  const selectedKey = ref<string | null>(null)
  const target = ref(0)
  const creating = ref(false)

  const selected = computed(() => templates.value?.find(t => t.key === selectedKey.value) ?? null)
  const formattedTarget = computed(() => selected.value ? formatGoalValue(selected.value, target.value) : '')
  const label = computed(() => selected.value ? makeGoalLabel(selected.value, target.value) : '')

  function select(key: string) {
    const tpl = templates.value?.find(t => t.key === key)
    if (!tpl) return
    selectedKey.value = key
    target.value = tpl.defaultTarget
  }

  function reset() {
    selectedKey.value = null
  }

  function changeTarget(delta: number) {
    const tpl = selected.value
    if (!tpl) return
    target.value = Math.max(tpl.min, +(target.value + delta * tpl.step).toFixed(2))
  }

  async function create() {
    if (!selected.value) return
    creating.value = true
    try {
      goals.value = await goalService.createGoal(selected.value.key, target.value)
      reset()
      await navigateTo('/goals')
    }
    finally {
      creating.value = false
    }
  }

  return { templates, selected, target, formattedTarget, label, creating, select, reset, changeTarget, create }
}
