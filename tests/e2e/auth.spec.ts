import { expect, test } from '@playwright/test'
import { E2E_PASSWORD, latestResetLink, registerUser, sharedUser, uniqueEmail } from './api'
import { THEMES, gotoReady, setProfile, setTheme, shot } from './helpers'

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

    test('reset password', async ({ page }, testInfo) => {
      await gotoReady(page, '/reset-password?token=screenshot&email=alex%40example.com')
      await expect(page.getByRole('heading', { name: 'Set a new password' })).toBeVisible()
      await expect(page.getByLabel('Email')).toHaveValue('alex@example.com')
      await shot(page, testInfo, 'reset-password', theme)
    })

    test('onboarding', async ({ context, page, baseURL }, testInfo) => {
      // Signed in (shared user's token) but no profile on this browser yet.
      await context.addCookies([{ name: 'humanos_token', value: encodeURIComponent(sharedUser().token), url: baseURL! }])
      await gotoReady(page, '/')
      await expect(page).toHaveURL(/\/onboarding$/)
      await expect(page.getByRole('heading', { name: 'What\'s your main goal, Alex?' })).toBeVisible()
      await shot(page, testInfo, 'onboarding-goal', theme)

      await page.getByRole('radio', { name: /Build muscle/ }).click()
      await page.getByRole('button', { name: 'Continue' }).click()
      await expect(page.getByRole('button', { name: 'Start using HumanOS' })).toBeDisabled()
      await page.getByLabel('Age').fill('29')
      await page.getByLabel('Height').fill('175')
      await page.getByLabel('Weight', { exact: true }).fill('70')
      await page.getByLabel('Target weight').fill('74')
      await page.getByRole('radio', { name: 'Very active' }).click()
      await shot(page, testInfo, 'onboarding-stats', theme)
    })
  })
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

  test('signup → onboarding → home', async ({ page }) => {
    await gotoReady(page, '/signup')
    await page.getByLabel('Name').fill('Jamie Rivera')
    await page.getByLabel('Email').fill(uniqueEmail('signup'))
    await page.getByLabel('Password', { exact: true }).fill(E2E_PASSWORD)
    await page.getByLabel('Confirm password').fill(E2E_PASSWORD)
    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page).toHaveURL(/\/onboarding$/)
    await expect(page.getByRole('heading', { name: 'What\'s your main goal, Jamie?' })).toBeVisible()
    await page.getByRole('radio', { name: /Build muscle/ }).click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByLabel('Age').fill('29')
    await page.getByLabel('Height').fill('175')
    await page.getByLabel('Weight', { exact: true }).fill('70')
    await page.getByLabel('Target weight').fill('74')
    await page.getByRole('radio', { name: 'Very active' }).click()
    await page.getByRole('button', { name: 'Start using HumanOS' }).click()

    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByText(/, Jamie — here's your plan/)).toBeVisible()
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
    await setProfile(context, baseURL!, user)
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
    await expect(page).toHaveURL(/\/login$/)
    expect((await context.cookies()).some(c => c.name === 'humanos_token')).toBe(false)
    await gotoReady(page, '/')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('forgot password → email link → new password → sign in', async ({ page, context, baseURL }) => {
    const user = await registerUser('reset', 'Riley Chen')
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

    await setProfile(context, baseURL!, user)
    await gotoReady(page, '/login')
    await page.getByLabel('Email').fill(user.email)
    await page.getByLabel('Password', { exact: true }).fill(newPassword)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByText(/, Riley — here's your plan/)).toBeVisible()
  })
})
