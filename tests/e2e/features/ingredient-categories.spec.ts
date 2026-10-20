import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { THEMES, gotoReady, setTheme, shot, signIn } from '../helpers'

/** Opens the create form from the recipe builder's picker and fills the required fields: 100 g, 60 kcal. */
const openSkyrForm = async (page: Page) => {
  await page.getByLabel('Add an ingredient').fill('Skyr')
  await page.getByRole('button', { name: '+ Create “Skyr”' }).click()
  await page.getByLabel('Calories (kcal)').fill('60')
}

/** Opens the New ingredient modal from /food and fills the required fields: 100 g, 60 kcal. */
const openSkyrModal = async (page: Page) => {
  await gotoReady(page, '/food')
  await page.getByRole('button', { name: 'New ingredient' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Ingredient name').fill('Skyr')
  await dialog.getByLabel('Calories (kcal)').fill('60')
  return dialog
}

test.beforeEach(async ({ context, baseURL }) => {
  await signIn(context, baseURL!)
})

for (const theme of THEMES) {
  test.describe(`ingredient categories (${theme})`, () => {
    test.beforeEach(async ({ context, page, baseURL }) => {
      await setTheme(context, theme, baseURL!)
      await gotoReady(page, '/food/recipes/new')
    })

    test('the form has an optional category, unset by default', async ({ page }, testInfo) => {
      await openSkyrForm(page)
      const category = page.getByLabel('Category (optional)')
      await expect(category).toBeVisible()
      await expect(category.locator('option:checked')).toHaveText('No category')
      await expect(category.locator('option')).toHaveCount(14)
      await expect(page.getByRole('button', { name: 'Add to recipe' })).toBeEnabled()
      await category.selectOption({ label: 'Condiments & sweeteners' })
      // Phones scroll the form inside the page; bring the field and the save button into the shot.
      await page.getByRole('button', { name: 'Add to recipe' }).scrollIntoViewIfNeeded()
      await shot(page, testInfo, 'category-form', theme)
    })

    test('the saved card shows the picked category', async ({ page }, testInfo) => {
      const dialog = await openSkyrModal(page)
      await dialog.getByLabel('Category (optional)').selectOption({ label: 'Dairy' })
      await dialog.getByRole('button', { name: 'Save ingredient' }).click()
      await expect(dialog.getByText('Skyr saved to My foods.')).toBeVisible()
      await expect(dialog.getByText('100 g · Dairy · 60 kcal')).toBeVisible()
      await shot(page, testInfo, 'category-saved-card', theme)
    })

    test('the saved card shows no category when none is picked', async ({ page }) => {
      const dialog = await openSkyrModal(page)
      await dialog.getByRole('button', { name: 'Save ingredient' }).click()
      await expect(dialog.getByText('Skyr saved to My foods.')).toBeVisible()
      await expect(dialog.getByText('100 g · 60 kcal', { exact: true })).toBeVisible()
    })

    test('catalog picker rows start with their category', async ({ page }, testInfo) => {
      await page.getByLabel('Add an ingredient').fill('chicken')
      const row = page.getByRole('button', { name: /^Chicken breast, boiled/ })
      await expect(row).toContainText('Chicken breast, boiledMeat & poultry · 100g · 150 kcal')
      await shot(page, testInfo, 'category-picker-catalog', theme)
    })

    test('a categorized custom ingredient shows its category in the picker', async ({ page }, testInfo) => {
      await openSkyrForm(page)
      await page.getByLabel('Category (optional)').selectOption({ label: 'Dairy' })
      await page.getByRole('button', { name: 'Add to recipe' }).click()
      await expect(page.getByText('Skyr', { exact: true })).toBeVisible()
      await page.getByLabel('Add an ingredient').fill('Skyr')
      await expect(page.getByText(/^My food · Dairy · 100 g · 60 kcal/).first()).toBeVisible()
      await shot(page, testInfo, 'category-picker-custom', theme)
    })
  })
}
