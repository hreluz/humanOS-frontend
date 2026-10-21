import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { THEMES, gotoReady, openQuickLog, setTheme, shot, signIn } from '../helpers'

// Mock data lives in the browser's copy of the service, so every change is followed by client-side
// navigation (clicks), never page.goto, which would reload the seeds.

/** Opens My foods from /food, the way a user gets there. */
const openMyFoods = async (page: Page) => {
  await gotoReady(page, '/food')
  await page.getByRole('link', { name: 'My foods' }).click()
  await expect(page.getByRole('heading', { name: 'My foods' })).toBeVisible()
}

const rows = (page: Page) => page.getByRole('main').getByRole('listitem')
const row = (page: Page, name: string) => rows(page).filter({ hasText: name })

test.beforeEach(async ({ context, baseURL }) => {
  await signIn(context, baseURL!)
})

for (const theme of THEMES) {
  test.describe(`my foods (${theme})`, () => {
    test.beforeEach(async ({ context, baseURL }) => {
      await setTheme(context, theme, baseURL!)
    })

    test('lists the custom foods from /food', async ({ page }, testInfo) => {
      await gotoReady(page, '/food')
      await shot(page, testInfo, 'my-foods-link', theme)
      await page.getByRole('link', { name: 'My foods' }).click()
      await expect(page).toHaveURL('/food/my-foods')
      await expect(rows(page)).toHaveCount(4)
      await expect(rows(page).first()).toContainText('Basil pesto')
      await expect(row(page, 'Bakery sourdough')).toContainText('100 g · Grains & starches · 260 kcal · $0.80')
      await expect(page.getByText('4 foods')).toBeVisible()
      await shot(page, testInfo, 'my-foods-list', theme)
    })

    test('filters by category', async ({ page }, testInfo) => {
      await openMyFoods(page)
      const category = page.getByLabel('Category')
      await expect(category.locator('option')).toHaveCount(15)

      await category.selectOption({ label: 'Grains & starches' })
      await expect(rows(page)).toHaveCount(1)
      await expect(page.getByText('1 food', { exact: true })).toBeVisible()

      await category.selectOption({ label: 'No category' })
      await expect(rows(page)).toHaveCount(1)
      await expect(rows(page).first()).toContainText('Basil pesto')

      await category.selectOption({ label: 'Fruit' })
      await expect(page.getByText('No foods in Fruit.')).toBeVisible()
      await shot(page, testInfo, 'my-foods-filter-empty', theme)
      await page.getByRole('button', { name: 'Show all' }).click()
      await expect(rows(page)).toHaveCount(4)
      await expect(category.locator('option:checked')).toHaveText('All categories')
    })

    test('edits a food and the quick log shows the change', async ({ page }, testInfo) => {
      await openMyFoods(page)
      await page.getByRole('link', { name: 'Edit Salsa verde' }).click()
      await expect(page.getByRole('heading', { name: 'Edit Salsa verde' })).toBeVisible()
      await expect(page.getByLabel('Ingredient name')).toHaveValue('Salsa verde')
      await expect(page.getByLabel('Calories (kcal)')).toHaveValue('45')
      await expect(page.getByLabel('Category (optional)').locator('option:checked')).toHaveText('Condiments & sweeteners')
      await shot(page, testInfo, 'my-foods-edit', theme)

      await page.getByLabel('Calories (kcal)').fill('50')
      await page.getByLabel('Category (optional)').selectOption({ label: 'Vegetables' })
      await page.getByRole('button', { name: 'Save changes' }).click()
      await expect(page).toHaveURL('/food/my-foods')
      await expect(row(page, 'Salsa verde')).toContainText('100 g · Vegetables · 50 kcal')

      await openQuickLog(page)
      const dialog = page.getByRole('dialog')
      await dialog.getByRole('button', { name: 'My Foods' }).click()
      await expect(dialog.getByText('My food · 100 g · 50 kcal')).toBeVisible()
    })

    test('clearing the price removes it from the row', async ({ page }) => {
      await openMyFoods(page)
      await expect(row(page, 'Homemade protein bar')).toContainText('$1.20')
      await page.getByRole('link', { name: 'Edit Homemade protein bar' }).click()
      await expect(page.getByLabel(/^Price/)).toHaveValue('1.20')
      await page.getByLabel(/^Price/).fill('')
      await page.getByRole('button', { name: 'Save changes' }).click()
      await expect(page).toHaveURL('/food/my-foods')
      await expect(row(page, 'Homemade protein bar')).toContainText('1 piece · Other · 210 kcal')
      await expect(row(page, 'Homemade protein bar')).not.toContainText('$')
    })

    test('deletes a food after confirming in the row', async ({ page }, testInfo) => {
      await openMyFoods(page)
      await page.getByRole('button', { name: 'Delete Basil pesto' }).click()
      const confirm = page.getByRole('group', { name: 'Delete Basil pesto?' })
      await expect(confirm).toBeVisible()
      await expect(confirm.getByRole('button', { name: 'Cancel' })).toBeFocused()
      await shot(page, testInfo, 'my-foods-confirm-delete', theme)

      await confirm.getByRole('button', { name: 'Cancel' }).click()
      await expect(rows(page)).toHaveCount(4)
      await expect(page.getByRole('button', { name: 'Delete Basil pesto' })).toBeFocused()

      await page.getByRole('button', { name: 'Delete Basil pesto' }).click()
      await page.keyboard.press('Escape')
      await expect(confirm).toBeHidden()
      await expect(rows(page)).toHaveCount(4)

      await page.getByRole('button', { name: 'Delete Basil pesto' }).click()
      await confirm.getByRole('button', { name: 'Delete' }).click()
      await expect(rows(page)).toHaveCount(3)
      await expect(row(page, 'Basil pesto')).toHaveCount(0)
      await expect(page.getByRole('button', { name: 'Delete Salsa verde' })).toBeFocused()

      await page.getByRole('link', { name: '← Food' }).click()
      await page.getByRole('link', { name: 'New recipe' }).click()
      await page.getByLabel('Add an ingredient').fill('pesto')
      await expect(page.getByRole('button', { name: /^Basil pesto/ })).toHaveCount(0)
      await page.getByLabel('Add an ingredient').fill('sourdough')
      await expect(page.getByRole('button', { name: /^Bakery sourdough/ })).toBeVisible()
    })

    test('a food created from the page appears at the top', async ({ page }) => {
      await openMyFoods(page)
      await page.getByRole('button', { name: 'New ingredient' }).click()
      const dialog = page.getByRole('dialog')
      await dialog.getByLabel('Ingredient name').fill('Skyr')
      await dialog.getByLabel('Calories (kcal)').fill('60')
      await dialog.getByRole('button', { name: 'Save ingredient' }).click()
      await dialog.getByRole('button', { name: 'Done' }).click()
      await expect(rows(page)).toHaveCount(5)
      await expect(rows(page).first()).toContainText('Skyr')
    })

    test('an unknown food shows a not-found message', async ({ page }, testInfo) => {
      await gotoReady(page, '/food/my-foods/unknown')
      await expect(page.getByText('This food doesn\'t exist anymore.')).toBeVisible()
      await shot(page, testInfo, 'my-foods-not-found', theme)
      await page.getByRole('link', { name: 'Back to My foods' }).click()
      await expect(rows(page)).toHaveCount(4)
    })
  })
}
