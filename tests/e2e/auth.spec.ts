import { type BrowserContext, type Page, expect, test } from '@playwright/test'
import { E2E_PASSWORD, METRIC_PROFILE, type TestUser, latestResetLink, newUser, registerUser, saveProfile, sharedUser, uniqueEmail } from './api'
import { THEMES, gotoReady, setGoal, setTheme, shot, signIn } from './helpers'

// The backend throttles register / forgot / reset to 6 per minute per IP. Screenshot tests below make
// at most one throttled call each; the API flows further down run once per run (desktop project only).

for (const theme of THEMES) {
  test.describe(`auth screens (${theme})`, () => {
    test.beforeEach(async ({ context, baseURL }) => {
      await setTheme(context, theme, baseURL!)
    })

    test('sign in', async ({ page }, testInfo) => {
      await gotoReady(page, '/login')
      await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
      await shot(page, testInfo, 'login', theme)

      await page.getByRole('button', { name: 'Sign in' }).click()
      await expect(page.getByText('Enter a valid email')).toBeVisible()
      await expect(page.getByText('Enter your password')).toBeVisible()
      await shot(page, testInfo, 'login-errors', theme)
    })

    test('sign up', async ({ page }, testInfo) => {
      await gotoReady(page, '/signup')
      await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible()
      await shot(page, testInfo, 'signup', theme)

      await page.getByLabel('Password', { exact: true }).fill('short')
      await page.getByRole('button', { name: 'Continue' }).click()
      await expect(page.getByText('At least 8 characters')).toBeVisible()
      await shot(page, testInfo, 'signup-errors', theme)
    })

    test('forgot password', async ({ page }, testInfo) => {
      await gotoReady(page, '/forgot-password')
      await shot(page, testInfo, 'forgot-password', theme)

      // Unregistered on purpose: same response, no email sent.
      await page.getByLabel('Email').fill('e2e-nobody@example.com')
      await page.getByRole('button', { name: 'Send reset link' }).click()
      await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible()
      await shot(page, testInfo, 'forgot-password-sent', theme)
    })

    test('signed out', async ({ page }, testInfo) => {
      await gotoReady(page, '/login?signedOut=1')
      await expect(page.getByText('You\'ve signed out.')).toBeVisible()
      await shot(page, testInfo, 'login-signed-out', theme)
    })

    test('account menu', async ({ page, context, baseURL, isMobile }, testInfo) => {
      test.skip(isMobile, 'The sidebar is desktop only')
      await signIn(context, baseURL!)
      await gotoReady(page, '/')
      await page.getByRole('button', { name: /Alex/ }).click()
      await expect(page.getByRole('menu', { name: 'Account' })).toBeVisible()
      await shot(page, testInfo, 'account-menu', theme)
    })

    test('reset password', async ({ page }, testInfo) => {
      await gotoReady(page, '/reset-password?token=screenshot&email=alex%40example.com')
      await expect(page.getByRole('heading', { name: 'Set a new password' })).toBeVisible()
      await expect(page.getByLabel('Email')).toHaveValue('alex@example.com')
      await shot(page, testInfo, 'reset-password', theme)
    })

    test('onboarding', async ({ context, page, baseURL }, testInfo) => {
      // Signed in as a user with no API profile yet. The form is never submitted, so the user stays that way.
      await context.addCookies([{ name: 'humanos_token', value: encodeURIComponent(newUser().token), url: baseURL! }])
      await gotoReady(page, '/')
      await expect(page).toHaveURL(/\/onboarding$/)
      await expect(page.getByRole('heading', { name: 'What\'s your main goal, Alex?' })).toBeVisible()
      await expect(page.getByText('Step 1 of 2')).toBeVisible()
      await shot(page, testInfo, 'onboarding', theme)

      await page.getByRole('radio', { name: /Build muscle/ }).click()
      await page.getByRole('button', { name: 'Continue' }).click()
      await expect(page.getByRole('button', { name: 'Start using HumanOS' })).toBeDisabled()
      await fillMetricStats(page, { weight: '70', target: '74' })
      await page.getByRole('radio', { name: /^Very active/ }).click()
      await shot(page, testInfo, 'onboarding-stats', theme)
    })
  })
}

/** Fills the metric stats step (birth date, sex, height, weight and, when given, target). */
async function fillMetricStats(page: Page, { weight, target }: { weight: string, target?: string }) {
  await page.getByLabel('Birth date').fill('1997-03-02')
  await page.getByRole('radio', { name: 'Female', exact: true }).click()
  await page.getByLabel('Height').fill('175')
  await page.getByLabel('Weight', { exact: true }).fill(weight)
  if (target) await page.getByLabel('Target weight').fill(target)
}

/** Signs in with only the token: no humanos_goal cookie on this browser. */
async function signInTokenOnly(context: BrowserContext, baseURL: string, user: TestUser) {
  await context.addCookies([{ name: 'humanos_token', value: encodeURIComponent(user.token), url: baseURL }])
}

test('signed-out visitors are sent to /login', async ({ page }) => {
  await gotoReady(page, '/food')
  await expect(page).toHaveURL(/\/login$/)
})

test('reset link without a token shows the invalid-link state', async ({ page }) => {
  await gotoReady(page, '/reset-password')
  await expect(page.getByRole('heading', { name: 'This reset link is invalid' })).toBeVisible()
  await page.getByRole('link', { name: 'Request a new link' }).click()
  await expect(page).toHaveURL(/\/forgot-password$/)
})

test.describe('auth flows against the API', () => {
  test.skip(({ isMobile }) => isMobile, 'Runs on desktop only, to stay under the backend throttles')

  async function signUp(page: Page, name: string, tag: string) {
    await gotoReady(page, '/signup')
    await page.getByLabel('Name').fill(name)
    await page.getByLabel('Email').fill(uniqueEmail(tag))
    await page.getByLabel('Password', { exact: true }).fill(E2E_PASSWORD)
    await page.getByLabel('Confirm password').fill(E2E_PASSWORD)
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page).toHaveURL(/\/onboarding$/)
  }

  const profilePut = (page: Page) => page.waitForRequest(req => req.method() === 'PUT' && req.url().endsWith('/v1/profile'))

  test('signup → onboarding (metric) → home shows the weight', async ({ page }) => {
    await signUp(page, 'Jamie Rivera', 'signup')
    await expect(page.getByRole('heading', { name: 'What\'s your main goal, Jamie?' })).toBeVisible()
    await page.getByRole('radio', { name: /Build muscle/ }).click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await fillMetricStats(page, { weight: '70', target: '74' })
    await page.getByRole('radio', { name: /^Very active/ }).click()
    const put = profilePut(page)
    await page.getByRole('button', { name: 'Start using HumanOS' }).click()

    expect((await put).postDataJSON()).toMatchObject({ unit_system: 'metric', sex: 'female', height: 175, weight: 70, target_weight: 74, activity_level: 'very_active' })
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByText(/, Jamie — here's your plan/)).toBeVisible()
    // The onboarding weight is this week's weigh-in, so home hides the log card; the weekly review shows it.
    await page.getByRole('link', { name: 'View full weekly review' }).click()
    await expect(page.getByTestId('weigh-in-row')).toHaveCount(1)
    await expect(page.getByTestId('weigh-in-row').first()).toContainText('70 kg')
  })

  test('signup → onboarding in imperial → /profile shows ft + in and lb', async ({ page, context, baseURL }) => {
    test.slow() // Signs up through the API (the UI signup is covered above), which may wait out the register throttle.
    await signInTokenOnly(context, baseURL!, await registerUser('imperial', 'Casey Lee'))
    await gotoReady(page, '/onboarding')
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByLabel('Birth date').fill('1990-04-15')
    await page.getByRole('radio', { name: 'Male', exact: true }).click()
    await page.getByRole('radio', { name: 'Imperial' }).click()
    await page.getByLabel('Height, feet').fill('5')
    await page.getByLabel('Height, inches').fill('11')
    await page.getByLabel('Weight', { exact: true }).fill('180')
    await page.getByLabel('Target weight').fill('170')
    const put = profilePut(page)
    await page.getByRole('button', { name: 'Start using HumanOS' }).click()

    expect((await put).postDataJSON()).toMatchObject({ unit_system: 'imperial', height: 71, weight: 180, target_weight: 170 })
    await expect(page).toHaveURL(/\/$/)
    await gotoReady(page, '/profile')
    await expect(page.getByText('5′ 11″')).toBeVisible()
    await expect(page.getByText('180 lb')).toBeVisible()
    await expect(page.getByText('Imperial', { exact: true })).toBeVisible()
  })

  test('onboarding with an empty birth date keeps the submit disabled', async ({ page, context, baseURL }) => {
    await signInTokenOnly(context, baseURL!, newUser())
    await gotoReady(page, '/onboarding')
    await page.getByRole('button', { name: 'Continue' }).click()
    await fillMetricStats(page, { weight: '70', target: '65' })
    await page.getByLabel('Birth date').fill('')
    await expect(page.getByRole('button', { name: 'Start using HumanOS' })).toBeDisabled()
    await expect(page.getByText('Add your birth date to continue.')).toBeVisible()
  })

  test('a user with an API profile but no goal on this browser picks a goal, then lands on /', async ({ page, context, baseURL }) => {
    // Shared user's token only: its profile exists on the API, but there is no humanos_goal cookie.
    await signInTokenOnly(context, baseURL!, sharedUser())
    const puts: string[] = []
    page.on('request', req => req.method() === 'PUT' && puts.push(req.url()))
    await gotoReady(page, '/food')

    await expect(page).toHaveURL(/\/onboarding$/)
    await expect(page.getByRole('heading', { name: 'What\'s your main goal, Alex?' })).toBeVisible()
    await expect(page.getByText('Step 1 of 2')).toBeHidden()
    await page.getByRole('radio', { name: /Maintain/ }).click()
    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByText(/, Alex — here's your plan/)).toBeVisible()
    expect(puts).toEqual([])
  })

  // These change the profile, so they use their own user (the shared one must not change). One user for both keeps
  // registrations under the backend throttle; serial keeps the order (the edit test expects the original activity).
  test.describe.serial('profile changes', () => {
    let user: TestUser
    test.beforeAll(async () => {
      test.setTimeout(120_000) // Registering may wait out the register throttle.
      user = await registerUser('profile', 'Sam Patel')
      await saveProfile(user, METRIC_PROFILE)
    })

    test('logging a weigh-in on /weekly-review updates the latest weight', async ({ page, context, baseURL }) => {
      await signIn(context, baseURL!, user)
      await gotoReady(page, '/weekly-review')
      // The profile save already logged this week, so the button updates it.
      await page.getByRole('button', { name: 'Update this week' }).click()
      const dialog = page.getByRole('dialog')
      await dialog.getByLabel('Weight').fill('81.6')
      const put = profilePut(page)
      await dialog.getByRole('button', { name: 'Save weigh-in' }).click()

      expect((await put).postDataJSON()).toEqual({ ...METRIC_PROFILE, weight: 81.6 })
      await expect(dialog).toBeHidden()
      // Two entries this week show as one point: the later one.
      await expect(page.getByTestId('weigh-in-row')).toHaveCount(1)
      await expect(page.getByTestId('weigh-in-row').first()).toContainText('81.6 kg')

      await page.reload()
      await expect(page.getByTestId('weigh-in-row').first()).toContainText('81.6 kg')
      await gotoReady(page, '/profile')
      await expect(page.getByText('81.6 kg')).toBeVisible()
    })

    test('Edit profile changes the activity level and it persists after reload', async ({ page, context, baseURL }) => {
      await signIn(context, baseURL!, user)
      await gotoReady(page, '/profile')
      await expect(page.getByText('Moderate')).toBeVisible()
      await page.getByRole('button', { name: 'Edit profile' }).click()
      const dialog = page.getByRole('dialog')
      await dialog.getByRole('radio', { name: /^Very active/ }).click()
      await dialog.getByRole('button', { name: 'Save changes' }).click()
      await expect(dialog).toBeHidden()
      await expect(page.getByRole('status').filter({ hasText: 'Profile updated' })).toBeVisible()
      await expect(page.getByText('Very active')).toBeVisible()

      await page.reload()
      await expect(page.getByText('Very active')).toBeVisible()
    })
  })

  test('signup with a registered email shows the API error', async ({ page }) => {
    await gotoReady(page, '/signup')
    await page.getByLabel('Name').fill('Alex Morgan')
    await page.getByLabel('Email').fill(sharedUser().email)
    await page.getByLabel('Password', { exact: true }).fill(E2E_PASSWORD)
    await page.getByLabel('Confirm password').fill(E2E_PASSWORD)
    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page.getByText('The email has already been taken.')).toBeVisible()
    await expect(page).toHaveURL(/\/signup$/)
  })

  test('login with a wrong password shows the API error', async ({ page, context }) => {
    await gotoReady(page, '/login')
    await page.getByLabel('Email').fill(sharedUser().email)
    await page.getByLabel('Password', { exact: true }).fill('not-the-password')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page.getByText('These credentials do not match our records.')).toBeVisible()
    expect((await context.cookies()).some(c => c.name === 'humanos_token')).toBe(false)
  })

  test('sign in, then sign out', async ({ page, context, baseURL }) => {
    const user = sharedUser()
    await setGoal(context, baseURL!, user)
    await gotoReady(page, '/login')
    await page.getByLabel('Email').fill(user.email)
    await page.getByLabel('Password', { exact: true }).fill(user.password)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByText(/, Alex — here's your plan/)).toBeVisible()

    await gotoReady(page, '/profile')
    await expect(page.getByText(user.email)).toBeVisible()
    const logout = page.waitForRequest(req => req.method() === 'POST' && req.url().endsWith('/v1/auth/logout'))
    await page.getByRole('button', { name: 'Sign out' }).click()
    await logout
    await expect(page).toHaveURL(/\/login\?signedOut=1$/)
    await expect(page.getByText('You\'ve signed out.')).toBeVisible()
    expect((await context.cookies()).some(c => c.name === 'humanos_token')).toBe(false)
    await gotoReady(page, '/')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('sign out from the sidebar account menu', async ({ page, context, baseURL }) => {
    // Stubbed so the shared token isn't revoked; the test above covers the real request.
    await signIn(context, baseURL!)
    await page.route('**/v1/auth/logout', route => route.fulfill({ status: 204 }))
    await gotoReady(page, '/')

    const account = page.getByRole('button', { name: /Alex/ })
    await account.click()
    await expect(account).toHaveAttribute('aria-expanded', 'true')
    await page.keyboard.press('Escape')
    await expect(page.getByRole('menu', { name: 'Account' })).toBeHidden()
    await expect(account).toBeFocused()

    await account.click()
    const logout = page.waitForRequest(req => req.method() === 'POST' && req.url().endsWith('/v1/auth/logout'))
    await page.getByRole('menuitem', { name: 'Sign out' }).click()
    await logout
    await expect(page).toHaveURL(/\/login\?signedOut=1$/)
    await expect(page.getByText('You\'ve signed out.')).toBeVisible()
    expect((await context.cookies()).some(c => c.name === 'humanos_token')).toBe(false)
  })

  test('sign out still signs out locally when the request fails', async ({ page, context, baseURL }) => {
    // The request never reaches the API, so the shared token stays valid for other tests.
    await signIn(context, baseURL!)
    await page.route('**/v1/auth/logout', route => route.abort())
    await gotoReady(page, '/profile')
    await page.getByRole('button', { name: 'Sign out' }).click()
    await expect(page).toHaveURL(/\/login\?signedOut=1$/)
    expect((await context.cookies()).some(c => c.name === 'humanos_token')).toBe(false)
  })

  test('forgot password → email link → new password → sign in', async ({ page, context, baseURL }) => {
    const user = await registerUser('reset', 'Riley Chen')
    await saveProfile(user, METRIC_PROFILE)
    const newPassword = 'brand-new-password-456'

    await gotoReady(page, '/forgot-password')
    await page.getByLabel('Email').fill(user.email)
    await page.getByRole('button', { name: 'Send reset link' }).click()
    await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible()

    const link = await latestResetLink(user.email)
    await gotoReady(page, link)
    await expect(page.getByLabel('Email')).toHaveValue(user.email)
    await page.getByLabel('New password').fill(newPassword)
    await page.getByLabel('Confirm password').fill(newPassword)
    await page.getByRole('button', { name: 'Update password' }).click()

    await expect(page).toHaveURL(/\/login\?reset=1$/)
    await expect(page.getByText('Password updated — sign in with your new password.')).toBeVisible()

    // The token is single-use.
    await gotoReady(page, link)
    await page.getByLabel('New password').fill(newPassword)
    await page.getByLabel('Confirm password').fill(newPassword)
    await page.getByRole('button', { name: 'Update password' }).click()
    await expect(page.getByText('This password reset token is invalid.')).toBeVisible()

    await setGoal(context, baseURL!, user)
    await gotoReady(page, '/login')
    await page.getByLabel('Email').fill(user.email)
    await page.getByLabel('Password', { exact: true }).fill(newPassword)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByText(/, Riley — here's your plan/)).toBeVisible()
  })
})
