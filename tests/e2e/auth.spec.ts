import { expect, test } from '@playwright/test'
import { THEMES, gotoReady, setTheme, shot } from './helpers'

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

      await page.getByLabel('Email').fill('alex@example.com')
      await page.getByRole('button', { name: 'Send reset link' }).click()
      await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible()
      await shot(page, testInfo, 'forgot-password-sent', theme)
    })

    test('signup → onboarding → home', async ({ page }, testInfo) => {
      await gotoReady(page, '/signup')
      await page.getByLabel('Name').fill('Jamie Rivera')
      await page.getByLabel('Email').fill('jamie@example.com')
      await page.getByLabel('Password', { exact: true }).fill('supersecret')
      await page.getByLabel('Confirm password').fill('supersecret')
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(/\/onboarding$/)
      await expect(page.getByRole('heading', { name: 'What\'s your main goal, Jamie?' })).toBeVisible()
      await shot(page, testInfo, 'onboarding-goal', theme)

      await page.getByRole('radio', { name: /Build muscle/ }).click()
      await page.getByRole('button', { name: 'Continue' }).click()
      const start = page.getByRole('button', { name: 'Start using HumanOS' })
      await expect(start).toBeDisabled()
      await page.getByLabel('Age').fill('29')
      await page.getByLabel('Height').fill('175')
      await page.getByLabel('Weight', { exact: true }).fill('70')
      await page.getByLabel('Target weight').fill('74')
      await page.getByRole('radio', { name: 'Very active' }).click()
      await shot(page, testInfo, 'onboarding-stats', theme)

      await start.click()
      await expect(page).toHaveURL(/\/$/)
      await expect(page.getByText(/, Jamie — here's your plan/)).toBeVisible()
    })
  })
}

test('signed-out visitors are sent to /login', async ({ page }) => {
  await gotoReady(page, '/food')
  await expect(page).toHaveURL(/\/login$/)
})

test('sign in, then sign out', async ({ page }) => {
  await gotoReady(page, '/login')
  await page.getByLabel('Email').fill('sam.lee@example.com')
  await page.getByLabel('Password', { exact: true }).fill('anything')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByText(/, Sam — here's your plan/)).toBeVisible()

  await gotoReady(page, '/profile')
  await expect(page.getByText('sam.lee@example.com')).toBeVisible()
  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page).toHaveURL(/\/login$/)
  await gotoReady(page, '/')
  await expect(page).toHaveURL(/\/login$/)
})
