import type { UserProfile } from '~/types/auth'

export function useProfileForm() {
  const { user, saveProfile } = useAuth()
  const { logWeighIn } = useWeighIns()
  const saving = ref(false)

  const initial = user.value?.profile
  const form = reactive<UserProfile>(initial ? { ...initial } : { goal: 'lose', age: '', height: '', weight: '', target: '', activity: 'Moderate' })

  const needsTarget = computed(() => goalNeedsTarget(form.goal))
  const valid = computed(() => profileStatsValid(form))

  /** Saves the profile; a new weight or activity level is also logged as this week's weigh-in. */
  async function save() {
    if (!valid.value || saving.value) return false
    saving.value = true
    try {
      await saveProfile({ ...form })
      if (!initial || +form.weight !== +initial.weight || form.activity !== initial.activity) {
        await logWeighIn(+form.weight, form.activity)
      }
      return true
    }
    finally {
      saving.value = false
    }
  }

  return { form, needsTarget, valid, saving, save }
}
