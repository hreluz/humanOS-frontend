import type { UserProfile } from '~/types/auth'

export function useOnboarding() {
  const { firstName, saveProfile } = useAuth()
  const { logWeighIn } = useWeighIns()
  const step = ref<0 | 1>(0)
  const submitting = ref(false)
  const profile = reactive<UserProfile>({ goal: 'lose', age: '', height: '', weight: '', target: '', activity: 'Moderate' })

  const needsTarget = computed(() => goalNeedsTarget(profile.goal))
  const statsValid = computed(() => profileStatsValid(profile))
  const canSubmit = computed(() => step.value === 0 || statsValid.value)

  async function next() {
    if (step.value === 0) {
      step.value = 1
      return
    }
    if (!statsValid.value) return
    submitting.value = true
    try {
      await saveProfile({ ...profile })
      // The onboarding weight is the first point on the weekly trend.
      await logWeighIn(+profile.weight, profile.activity)
      await navigateTo('/')
    }
    finally {
      submitting.value = false
    }
  }

  const back = () => { step.value = 0 }

  return { step, profile, firstName, needsTarget, statsValid, canSubmit, submitting, next, back }
}
