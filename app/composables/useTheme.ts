import type { ThemePreference } from '~/types/ui'

const COOKIE_OPTS = { default: (): ThemePreference => 'system', sameSite: 'lax' as const, maxAge: 60 * 60 * 24 * 365 }

export function useTheme() {
  const cookie = useCookie<ThemePreference>('humanos_theme', COOKIE_OPTS)
  const preference = useState<ThemePreference>('theme-preference', () => cookie.value)

  function setPreference(value: ThemePreference) {
    preference.value = value
    cookie.value = value
  }

  return { preference, setPreference }
}

/** Keeps the `dark` class on <html> in sync. The inline head script handles first paint. */
export function useThemeEffect() {
  const { preference } = useTheme()
  onMounted(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = preference.value === 'dark' || (preference.value === 'system' && mq.matches)
      document.documentElement.classList.toggle('dark', dark)
    }
    apply()
    mq.addEventListener('change', apply)
    const stop = watch(preference, apply)
    onBeforeUnmount(() => {
      mq.removeEventListener('change', apply)
      stop()
    })
  })
}
