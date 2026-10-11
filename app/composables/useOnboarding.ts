import type { UserProfile } from '~/types/auth'

export function useOnboarding() {
  const draft = useSignupDraft()
  const { completeOnboarding } = useAuth()
  const step = ref<0 | 1>(0)
  const submitting = ref(false)
  const profile = reactive<UserProfile>({ goal: 'lose', age: '', height: '', weight: '', target: '', activity: 'Moderate' })

  const firstName = computed(() => draft.value?.name.split(' ')[0] ?? '')
  const needsTarget = computed(() => goalNeedsTarget(profile.goal))
  const statsValid = computed(() =>
    +profile.age > 0 && +profile.height > 0 && +profile.weight > 0 && (!needsTarget.value || +profile.target > 0),
  )
  const canSubmit = computed(() => step.value === 0 || statsValid.value)

  async function next() {
    if (step.value === 0) {
      step.value = 1
      return
    }
    if (!statsValid.value || !draft.value) return
    submitting.value = true
    try {
      await completeOnboarding(draft.value, { ...profile })
      draft.value = null
      await navigateTo('/')
    }
    finally {
      submitting.value = false
    }
  }

  const back = () => { step.value = 0 }

  return { step, profile, firstName, needsTarget, statsValid, canSubmit, submitting, next, back }
}
