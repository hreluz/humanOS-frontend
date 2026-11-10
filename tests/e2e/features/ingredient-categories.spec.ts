import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { THEMES, gotoReady, setTheme, shot, signIn, signInAsNewUser } from '../helpers'

/** Opens the create form from the recipe builder's picker, with the name filled from the search. */
const openSkyrForm = async (page: Page) => {
  await page.getByLabel('Add an ingredient').fill('Skyr')
  await page.getByRole('button', { name: '+ Create “Skyr”' }).click()
}

test.beforeEach(async ({ context, baseURL }) => {
  await signIn(context, baseURL!)
})

for (const theme of THEMES) {
  test.describe(`ingredient categories (${theme})`, () => {
    test.beforeEach(async ({ context, baseURL }) => {
      await setTheme(context, theme, baseURL!)
    })

    test('the category is required, with no "No category" option', async ({ page }, testInfo) => {
      await gotoReady(page, '/food/recipes/new')
      await openSkyrForm(page)
      const category = page.getByLabel('Category')
      await expect(category.locator('option:checked')).toHaveText('Choose a category')
      await expect(category.locator('option')).toHaveCount(14)
      await expect(category.locator('option', { hasText: 'No category' })).toHaveCount(0)
      await page.getByLabel('Calories', { exact: true }).fill('60')
      await expect(page.getByText('Add a category to save.')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Add to recipe' })).toBeDisabled()
      // Phones scroll the form inside the page; bring the field and the save button into the shot.
      await page.getByRole('button', { name: 'Add to recipe' }).scrollIntoViewIfNeeded()
      await shot(page, testInfo, 'category-required', theme)

      await category.selectOption({ label: 'Dairy' })
      await expect(page.getByText('Add a category to save.')).toBeHidden()
      await expect(page.getByRole('button', { name: 'Add to recipe' })).toBeEnabled()
    })

    test('the saved card shows the picked category', async ({ page, context, baseURL }, testInfo) => {
      await signInAsNewUser(context, baseURL!, 'categories-card')
      await gotoReady(page, '/food')
      await page.getByRole('button', { name: 'New ingredient' }).click()
      const dialog = page.getByRole('dialog')
      await dialog.getByLabel('Name', { exact: true }).fill('Skyr')
      await dialog.getByLabel('Category').selectOption({ label: 'Dairy' })
      await dialog.getByLabel('Calories', { exact: true }).fill('60')
      await dialog.getByRole('button', { name: 'Save ingredient' }).click()
      await expect(dialog.getByText('Skyr saved to My foods.')).toBeVisible()
      await expect(dialog.getByText('100 g · Dairy · 60 kcal')).toBeVisible()
      await shot(page, testInfo, 'category-saved-card', theme)
    })

    test('catalog picker rows start with their category', async ({ page }, testInfo) => {
      await gotoReady(page, '/food/recipes/new')
      await page.getByLabel('Add an ingredient').fill('chicken breast')
      const row = page.getByRole('button', { name: /^Chicken breast, roasted/ })
      await expect(row).toContainText('Meat & poultry · 100 g · 165 kcal · 31g protein · 0g carbs')
      await shot(page, testInfo, 'category-picker-catalog', theme)
    })
  })
}
