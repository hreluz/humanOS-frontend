import type { FieldErrors } from '~/types/auth'
import type { ProfileForm } from '~/types/profile'

export function useOnboarding() {
  const { firstName, hasProfile, hasGoal, saveProfile, setGoal } = useAuth()
  // Signed in with an API profile but no goal on this browser (e.g. a new device): only the goal step.
  // Read once, so picking the goal doesn't flip the page to the stats step before navigating away.
  const goalOnly = hasProfile.value && !hasGoal.value
  const step = ref<0 | 1>(0)
  const submitting = ref(false)
  const form = reactive<ProfileForm>({
    goal: 'lose', unitSystem: 'metric', birthDate: '', sex: '',
    heightCm: '', heightFt: '', heightIn: '', weight: '', target: '', activityLevel: 'moderately_active',
  })
  const errors = reactive<FieldErrors>({})
  const formError = ref<string>()

  const statsValid = computed(() => profileStatsValid(form))
  const canSubmit = computed(() => step.value === 0 || statsValid.value)

  async function next() {
    if (step.value === 0) {
      if (!goalOnly) {
        step.value = 1
        return
      }
      setGoal(form.goal)
      await navigateTo('/')
      return
    }
    if (!statsValid.value || submitting.value) return
    for (const key of Object.keys(errors)) errors[key] = undefined
    formError.value = undefined
    submitting.value = true
    try {
      // The PUT also records the first weight entry.
      await saveProfile(toPayload(form))
      setGoal(form.goal)
      await navigateTo('/')
    }
    catch (err) {
      const mapped = toProfileErrors(err, form.unitSystem)
      if (!mapped) formError.value = toFormMessage(err)
      else {
        Object.assign(errors, mapped.fields)
        formError.value = mapped.formError
      }
    }
    finally {
      submitting.value = false
    }
  }

  const back = () => { step.value = 0 }

  return { step, form, errors, formError, firstName, goalOnly, statsValid, canSubmit, submitting, next, back }
}
