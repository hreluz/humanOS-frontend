import { expect, test } from '@playwright/test'
import { THEMES, gotoReady, openQuickLog, setTheme, shot, signIn } from './helpers'

const ROUTES: { path: string, name: string, ready: string | RegExp }[] = [
  { path: '/', name: 'home', ready: /more protein/ },
  { path: '/food', name: 'food', ready: 'Breakfast' },
  { path: '/train', name: 'train', ready: 'Bench Press' },
  { path: '/stats', name: 'stats', ready: 'Resting HR' },
  { path: '/goals', name: 'goals', ready: 'Eat 170g protein daily' },
  { path: '/goals/new', name: 'new-goal', ready: 'What do you want to track?' },
  { path: '/food/recipes/new', name: 'new-recipe', ready: 'Ingredients' },
  { path: '/weekly-review', name: 'weekly-review', ready: 'Weight trend' },
  { path: '/profile', name: 'profile', ready: 'About you' },
]

const MODALS: { name: string, from: string, trigger: string | RegExp, ready: string }[] = [
  { name: 'modal-ingredient', from: '/food', trigger: 'New ingredient', ready: 'Ingredient name' },
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
    await page.getByRole('button', { name: 'Log 1 item' }).click()
    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(page.getByTestId('kcal-total')).toHaveText('1,475 / 2,600')

    await page.getByRole('link', { name: 'Home' }).first().click()
    await expect(page.getByTestId('kcal-remaining')).toHaveText('You can still eat 1125 kcal')
  })

  test('logging food moves the protein goal and shows on Home', async ({ page }) => {
    await gotoReady(page, '/goals')
    const protein = page.getByText('Eat 170g protein daily').locator('..')
    await expect(protein).toContainText('118g today')
    await openQuickLog(page)
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Search foods').fill('boiled')
    await dialog.getByRole('button', { name: 'Add Chicken breast, boiled' }).click()
    await expect(dialog.getByText('118g → 148g of 170g')).toBeVisible()
    await dialog.getByRole('button', { name: 'Log 1 item' }).click()
    await expect(dialog).toBeHidden()
    await expect(protein).toContainText('148g today')

    await page.getByRole('link', { name: 'Home' }).first().click()
    await expect(page.getByRole('region', { name: 'Logged today' }).getByText('Chicken breast, boiled')).toBeVisible()
  })

  test('logging an activity moves the active calories goal', async ({ page }) => {
    await gotoReady(page, '/goals')
    const active = page.getByText('Burn 500 active kcal daily').locator('..')
    await expect(active).toContainText('341 kcal today')
    await openQuickLog(page)
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('radio', { name: 'Activity' }).click()
    await dialog.getByLabel('Search activities').fill('cyc')
    await dialog.getByRole('radio', { name: /Cycling/ }).click()
    await expect(dialog.getByLabel('Cycling amount')).toHaveValue('15')
    await dialog.getByRole('button', { name: 'Log cycling' }).click()
    await expect(dialog).toBeHidden()
    await expect(active).not.toContainText('341 kcal today')

    await page.getByRole('link', { name: 'Train' }).first().click()
    await expect(page.getByText(/15 min · \d+ kcal · logged at/)).toBeVisible()
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
    await page.getByRole('link', { name: 'New recipe' }).click()
    await expect(page).toHaveURL(/\/food\/recipes\/new$/)
    await page.getByRole('button', { name: 'More servings' }).click()
    await expect(page.getByText('2 servings')).toBeVisible()
    await page.getByRole('button', { name: 'Remove Olive oil' }).click()
    await expect(page.getByText('Olive oil')).toHaveCount(0)
    await page.getByRole('button', { name: 'Save recipe' }).click()
    await expect(page).toHaveURL(/\/food$/)

    await page.getByRole('button', { name: '+ Log food' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'My Foods' }).click()
    await expect(page.getByRole('dialog').getByText('Chicken & Rice Bowl', { exact: true })).toBeVisible()
  })

  test('recipe can\'t be saved without a name or ingredients', async ({ page }) => {
    await gotoReady(page, '/food/recipes/new')
    const saveBtn = page.getByRole('button', { name: 'Save recipe' })
    await expect(saveBtn).toBeEnabled()
    await page.getByLabel('Recipe name').fill('')
    await page.getByLabel('Recipe name').blur()
    await expect(saveBtn).toBeDisabled()
    await expect(saveBtn).toHaveAccessibleDescription('Add a name to save.')
    await page.getByLabel('Recipe name').fill('Bowl')
    await page.getByLabel('Recipe name').blur()
    await expect(saveBtn).toHaveAccessibleDescription('')

    // Removing keeps focus in the list, then falls back to the search.
    await expect(page.getByText('3 items')).toHaveAttribute('aria-live', 'polite')
    await page.getByRole('button', { name: 'Remove Jasmine rice, cooked' }).click()
    await expect(page.getByRole('button', { name: 'Remove Olive oil' })).toBeFocused()
    await page.getByRole('button', { name: 'Remove Olive oil' }).click()
    await expect(page.getByRole('button', { name: 'Remove Chicken breast, grilled' })).toBeFocused()
    await page.getByRole('button', { name: 'Remove Chicken breast, grilled' }).click()
    await expect(page.getByLabel('Add an ingredient')).toBeFocused()
    await expect(page.getByText('Add the first ingredient below.')).toBeVisible()
    await page.getByLabel('Add an ingredient').blur()
    await expect(saveBtn).toBeDisabled()
    await expect(saveBtn).toHaveAccessibleDescription('Add an ingredient to save.')
  })

  test('inline search adds an ingredient', async ({ page }, testInfo) => {
    await gotoReady(page, '/food/recipes/new')
    await expect(page.getByText('3 items')).toBeVisible()
    const search = page.getByLabel('Add an ingredient')
    await search.fill('whey')
    await page.getByRole('button', { name: /^Whey protein/ }).click()
    await expect(page.getByText('4 items')).toBeVisible()
    await expect(page.getByText('Whey protein', { exact: true })).toBeVisible()
    await expect(search).toHaveValue('')
    if (testInfo.project.name === 'mobile') {
      // A tap lets go of the search so the keyboard closes and Save is reachable.
      await expect(search).not.toBeFocused()
      await expect(page.getByRole('button', { name: 'Save recipe' })).toBeEnabled()
    }
    else {
      await expect(search).toBeFocused()
    }
  })

  test('custom ingredient is added to the recipe and saved to My Foods', async ({ page }) => {
    await gotoReady(page, '/food/recipes/new')
    const perServingKcal = page.getByTestId('per-serving-kcal').filter({ visible: true })
    await expect(perServingKcal).toHaveText('960 kcal')
    await page.getByLabel('Add an ingredient').fill('tahini')
    await expect(page.getByText('No match for “tahini”.')).toBeVisible()
    await page.getByRole('button', { name: '+ Create “tahini”' }).click()
    await expect(page.getByLabel('Ingredient name')).toHaveValue('tahini')
    const add = page.getByRole('button', { name: 'Add to recipe' })
    await expect(add).toBeDisabled()
    await page.getByLabel('Nutrition per').fill('15')
    await page.getByLabel('Calories (kcal)').fill('90')
    await page.getByLabel('Fat (g)').fill('8')
    await add.click()
    await expect(page.getByText('tahini', { exact: true })).toBeVisible()
    await page.getByLabel('Add an ingredient').blur()
    await expect(perServingKcal).toHaveText('1050 kcal')

    await page.getByLabel('Add an ingredient').fill('tahini')
    await expect(page.getByText('My food · 15 g · 90 kcal · 0g protein · 0g carbs')).toBeVisible()

    await page.getByRole('link', { name: '← Back to food' }).click()
    await page.getByRole('button', { name: '+ Log food' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'My Foods' }).click()
    await expect(page.getByRole('dialog').getByText('tahini', { exact: true })).toBeVisible()
  })

  test('ingredient search: helper text and Escape steps back', async ({ page }) => {
    await gotoReady(page, '/food/recipes/new')
    const search = page.getByLabel('Add an ingredient')
    await search.fill('Tahini')
    await page.getByRole('button', { name: '+ Create “Tahini”' }).click()
    await expect(page.getByLabel('Calories (kcal)')).toBeFocused()
    await expect(page.getByText('Add calories to save.')).toBeVisible()
    await page.getByLabel('Calories (kcal)').fill('90')
    await expect(page.getByText(/to save\.$/)).toBeHidden()

    await page.keyboard.press('Escape')
    await expect(search).toBeFocused()
    await expect(search).toHaveValue('Tahini')
    await page.keyboard.press('Escape')
    await expect(search).toHaveValue('')
    await expect(page).toHaveURL(/\/food\/recipes\/new$/)
  })

  test('ingredient created from the Food page is saved to My Foods', async ({ page }) => {
    await gotoReady(page, '/food')
    await page.getByRole('button', { name: 'New ingredient' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Ingredient name').fill('Tahini')
    await dialog.getByLabel('Nutrition per').fill('15')
    await dialog.getByLabel('Calories (kcal)').fill('90')
    await dialog.getByRole('button', { name: 'Save ingredient' }).click()
    await expect(dialog.getByText('Tahini saved to My foods.')).toBeVisible()
    await dialog.getByRole('button', { name: 'Create another' }).click()
    await expect(dialog.getByLabel('Ingredient name')).toHaveValue('')
    await dialog.getByRole('button', { name: 'Close' }).click()
    await expect(dialog).toBeHidden()

    await page.getByRole('link', { name: 'New recipe' }).click()
    await page.getByLabel('Add an ingredient').fill('tahini')
    await expect(page.getByText('My food · 15 g · 90 kcal · 0g protein · 0g carbs')).toBeVisible()
    await page.getByRole('link', { name: '← Back to food' }).click()

    await page.getByRole('button', { name: '+ Log food' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'My Foods' }).click()
    await expect(page.getByRole('dialog').getByText('Tahini', { exact: true })).toBeVisible()
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
