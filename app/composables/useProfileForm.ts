import type { FieldErrors } from '~/types/auth'
import type { Profile, ProfileForm } from '~/types/profile'

/** Edit profile form prefilled from the API profile (imperial height split into ft + in) and the goal. */
function toForm(profile: Profile | null, goal: ProfileForm['goal']): ProfileForm {
  const imperial = profile?.unitSystem === 'imperial'
  const { ft, in: inches } = inchesToFtIn(imperial ? profile.height : 0)
  const str = (n: number | null | undefined) => (n == null ? '' : String(n))
  return {
    goal,
    unitSystem: profile?.unitSystem ?? 'metric',
    birthDate: profile?.birthDate ?? '',
    sex: profile?.sex ?? '',
    heightCm: imperial ? '' : str(profile?.height),
    heightFt: imperial ? String(ft) : '',
    heightIn: imperial ? String(inches) : '',
    weight: str(profile?.weight),
    target: str(profile?.targetWeight),
    activityLevel: profile?.activityLevel ?? 'moderately_active',
  }
}

export function useProfileForm() {
  const { profile, goal, saveProfile, setGoal } = useAuth()
  const { refresh } = useWeighIns()
  const saving = ref(false)

  const form = reactive<ProfileForm>(toForm(profile.value, goal.value ?? 'lose'))
  const errors = reactive<FieldErrors>({})
  const formError = ref<string>()

  const valid = computed(() => profileStatsValid(form))

  /** PUTs the full profile (the backend also records a weight entry) and keeps the goal on this browser. */
  async function save() {
    if (!valid.value || saving.value) return false
    for (const key of Object.keys(errors)) errors[key] = undefined
    formError.value = undefined
    saving.value = true
    try {
      await saveProfile(toPayload(form))
      setGoal(form.goal)
      await refresh()
      return true
    }
    catch (err) {
      const mapped = toProfileErrors(err, form.unitSystem)
      if (!mapped) formError.value = toFormMessage(err)
      else {
        Object.assign(errors, mapped.fields)
        formError.value = mapped.formError
      }
      return false
    }
    finally {
      saving.value = false
    }
  }

  return { form, errors, formError, valid, saving, save }
}
