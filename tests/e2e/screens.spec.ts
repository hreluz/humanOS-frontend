import { expect, test } from '@playwright/test'
import { THEMES, gotoReady, setTheme, shot, signIn } from './helpers'

const ROUTES: { path: string, name: string, ready: string | RegExp }[] = [
  { path: '/', name: 'home', ready: /more protein/ },
  { path: '/food', name: 'food', ready: 'Breakfast' },
  { path: '/train', name: 'train', ready: 'Bench Press' },
  { path: '/stats', name: 'stats', ready: 'Resting HR' },
  { path: '/goals', name: 'goals', ready: 'Eat 170g protein daily' },
  { path: '/goals/new', name: 'new-goal', ready: 'What do you want to track?' },
  { path: '/weekly-review', name: 'weekly-review', ready: 'Weight trend' },
  { path: '/profile', name: 'profile', ready: 'About you' },
]

const MODALS: { name: string, from: string, trigger: string | RegExp, ready: string }[] = [
  { name: 'modal-food-search', from: '/food', trigger: '+ Log food', ready: 'Verified' },
  { name: 'modal-recipe', from: '/food', trigger: 'New recipe', ready: 'Per serving' },
  { name: 'modal-meal-planner', from: '/food', trigger: 'Meal planner', ready: 'Generate grocery list' },
  { name: 'modal-grocery', from: '/food', trigger: 'Grocery list', ready: 'Pantry' },
  { name: 'modal-coach', from: '/', trigger: /Coach's tip for today/, ready: 'Your weight has plateaued' },
  { name: 'modal-edit-profile', from: '/profile', trigger: 'Edit profile', ready: 'Birth date' },
  // The shared user's profile save logged this week, so the review offers to update it.
  { name: 'modal-weigh-in', from: '/weekly-review', trigger: 'Update this week', ready: 'Update this week\'s weight' },
]

test.beforeEach(async ({ context, baseURL }) => {
  await signIn(context, baseURL!)
})

for (const theme of THEMES) {
  test.describe(`screens (${theme})`, () => {
    test.beforeEach(async ({ context, baseURL }) => {
      await setTheme(context, theme, baseURL!)
    })

    for (const route of ROUTES) {
      test(route.name, async ({ page }, testInfo) => {
        await gotoReady(page, route.path)
        await expect(page.getByText(route.ready).first()).toBeVisible()
        await shot(page, testInfo, route.name, theme)
      })
    }

    test('onboarding-goal', async ({ page, context }, testInfo) => {
      // API profile but no goal on this browser: onboarding shows only the goal step.
      await context.clearCookies({ name: 'humanos_goal' })
      await gotoReady(page, '/')
      await expect(page).toHaveURL(/\/onboarding$/)
      await expect(page.getByRole('heading', { name: 'What\'s your main goal, Alex?' })).toBeVisible()
      await shot(page, testInfo, 'onboarding-goal', theme)
    })

    for (const modal of MODALS) {
      test(modal.name, async ({ page }, testInfo) => {
        await gotoReady(page, modal.from)
        await page.getByRole('button', { name: modal.trigger }).click()
        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible()
        await expect(dialog.getByText(modal.ready).first()).toBeVisible()
        await shot(page, testInfo, modal.name, theme)
      })
    }
  })
}

test.describe('interactions', () => {
  test('logging food updates calorie totals', async ({ page }) => {
    await gotoReady(page, '/food')
    await expect(page.getByTestId('kcal-total')).toHaveText('1,360 / 2,600')
    await page.getByRole('button', { name: '+ Log food' }).click()
    await page.getByRole('button', { name: 'Add Granola' }).click()
    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(page.getByTestId('kcal-total')).toHaveText('1,475 / 2,600')

    await page.getByRole('link', { name: 'Home' }).first().click()
    await expect(page.getByTestId('kcal-remaining')).toHaveText('You can still eat 1125 kcal')
  })

  test('food search filters by query and tab', async ({ page }) => {
    await gotoReady(page, '/food')
    await page.getByRole('button', { name: '+ Log food' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Search foods').fill('chicken breast')
    await expect(dialog.getByText('Greek yogurt, plain')).toBeHidden()
    await expect(dialog.getByText('Chicken breast, grilled')).toBeVisible()
    await dialog.getByRole('button', { name: 'Verified' }).click()
    await expect(dialog.getByText("Trader Joe's Chicken Breast")).toBeVisible()
    await expect(dialog.getByText('Chicken breast, grilled')).toBeHidden()
  })

  test('saved recipe shows up in My Foods', async ({ page }) => {
    await gotoReady(page, '/food')
    await page.getByRole('button', { name: 'New recipe' }).click()
    await page.getByRole('button', { name: 'More servings' }).click()
    await expect(page.getByText('3 servings')).toBeVisible()
    await page.getByRole('button', { name: 'Remove Olive oil' }).click()
    await expect(page.getByText('240 kcal kcal')).toHaveCount(0)
    await page.getByRole('button', { name: 'Save recipe' }).click()
    await expect(page.getByRole('dialog')).toBeHidden()

    await page.getByRole('button', { name: '+ Log food' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'My Foods' }).click()
    await expect(page.getByRole('dialog').getByText('Chicken & Rice Bowl', { exact: true })).toBeVisible()
  })

  test('grocery items toggle', async ({ page }) => {
    await gotoReady(page, '/food')
    await page.getByRole('button', { name: 'Grocery list' }).click()
    const salmon = page.getByRole('checkbox', { name: /Salmon fillets/ })
    await expect(salmon).toHaveAttribute('aria-checked', 'false')
    await salmon.click()
    await expect(salmon).toHaveAttribute('aria-checked', 'true')
  })

  test('creating a goal lands on /goals', async ({ page }) => {
    await gotoReady(page, '/goals/new')
    await page.getByRole('button', { name: /Daily steps/ }).click()
    await page.getByRole('button', { name: 'Increase target' }).click()
    await expect(page.getByText('"Walk 10,500 steps"')).toBeVisible()
    await page.getByRole('button', { name: 'Create goal' }).click()
    await expect(page).toHaveURL(/\/goals$/)
    await expect(page.getByText('Walk 10,500 steps')).toBeVisible()
  })

  test('coach replies to a message', async ({ page }) => {
    await gotoReady(page, '/')
    await page.getByRole('button', { name: /Coach's tip for today/ }).click()
    await page.getByLabel('Message your coach').fill('I slept 5 hours')
    await page.keyboard.press('Enter')
    await expect(page.getByText('I slept 5 hours')).toBeVisible()
    await expect(page.getByText(/fold that into tomorrow's plan/)).toBeVisible()
  })

  test('theme switcher persists across reloads', async ({ page }) => {
    await gotoReady(page, '/')
    await page.getByRole('radio', { name: 'Dark' }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await page.reload()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await page.getByRole('radio', { name: 'Light' }).click()
    await expect(page.locator('html')).not.toHaveClass(/dark/)
  })
})
