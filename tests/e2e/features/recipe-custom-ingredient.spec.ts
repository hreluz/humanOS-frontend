import { expect, test } from '@playwright/test'
import { THEMES, gotoReady, setTheme, shot, signIn, signInAsNewUser, waitForImages } from '../helpers'

test.beforeEach(async ({ context, baseURL }) => {
  await signIn(context, baseURL!)
})

for (const theme of THEMES) {
  test.describe(`recipe custom ingredient (${theme})`, () => {
    test.beforeEach(async ({ context, page, baseURL }) => {
      await setTheme(context, theme, baseURL!)
      await gotoReady(page, '/food/recipes/new')
    })

    test('no match offers to create it', async ({ page }, testInfo) => {
      await page.getByLabel('Add an ingredient').fill('skyr')
      await expect(page.getByText('No foods match “skyr”')).toBeVisible()
      await expect(page.getByRole('button', { name: '+ Create “skyr”' })).toBeVisible()
      await shot(page, testInfo, 'recipe-ingredient-no-match', theme)
    })

    test('search needs 3 letters', async ({ page }) => {
      await page.getByLabel('Add an ingredient').fill('to')
      await expect(page.getByText('Type at least 3 letters to search.')).toBeVisible()
      await expect(page.getByRole('button', { name: '+ Create “to”' })).toBeVisible()
    })

    test('search results', async ({ page }, testInfo) => {
      await page.getByLabel('Add an ingredient').fill('tofu')
      await expect(page.getByRole('button', { name: /^Tofu, firm/ })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Photos of Tofu, firm' })).toBeVisible()
      await waitForImages(page.getByRole('button', { name: 'Photos of Tofu, firm' }))
      await shot(page, testInfo, 'recipe-ingredient-results', theme)
    })

    test('lines take grams or a portion', async ({ page }) => {
      await page.getByLabel('Add an ingredient').fill('avocado')
      await page.getByRole('button', { name: /^Avocado/ }).click()
      const unit = page.getByLabel('Unit for Avocado')
      const amount = page.getByLabel('Avocado amount')
      await expect(unit.locator('option:checked')).toHaveText('1 avocado')
      await expect(amount).toHaveValue('1')
      await amount.fill('0.5')
      await amount.blur()
      // Half of a 201 g avocado at 160 kcal per 100 g.
      await expect(page.getByText(/^161 kcal · /)).toBeVisible()
      await unit.selectOption({ label: 'g' })
      await expect(amount).toHaveValue('100')
    })

    test('create form filled in', async ({ page, context, baseURL }, testInfo) => {
      await signInAsNewUser(context, baseURL!, 'recipe-create')
      await gotoReady(page, '/food/recipes/new')
      await page.getByLabel('Add an ingredient').fill('Skyr')
      await page.getByRole('button', { name: '+ Create “Skyr”' }).click()
      await page.getByLabel('Category').selectOption({ label: 'Dairy' })
      await page.getByLabel('Calories', { exact: true }).fill('60')
      await page.getByLabel('Protein (g)').fill('11')
      await page.getByLabel('Carbs (g)').fill('4')
      await page.getByLabel('Fat (g)').fill('0.2')
      await expect(page.getByRole('button', { name: 'Add to recipe' })).toBeEnabled()
      await shot(page, testInfo, 'recipe-ingredient-create', theme)
      await page.getByRole('button', { name: 'Add to recipe' }).click()
      await expect(page.getByText('Skyr', { exact: true })).toBeVisible()
      await shot(page, testInfo, 'recipe-ingredient-added', theme)
    })

    test('standalone from the Food page', async ({ page, context, baseURL }, testInfo) => {
      await signInAsNewUser(context, baseURL!, 'recipe-modal')
      await gotoReady(page, '/food')
      await shot(page, testInfo, 'food-header', theme)
      await page.getByRole('button', { name: 'New ingredient' }).click()
      const dialog = page.getByRole('dialog')
      await dialog.getByLabel('Name', { exact: true }).fill('Skyr')
      await dialog.getByLabel('Category').selectOption({ label: 'Dairy' })
      await dialog.getByLabel('Calories', { exact: true }).fill('60')
      await shot(page, testInfo, 'ingredient-modal', theme)
      await dialog.getByRole('button', { name: 'Save ingredient' }).click()
      await expect(dialog.getByText('Skyr saved to My foods.')).toBeVisible()
      await shot(page, testInfo, 'ingredient-modal-saved', theme)
    })

    test('the sum of protein, carbs and fat is checked', async ({ page }) => {
      await page.getByLabel('Add an ingredient').fill('Skyr')
      await page.getByRole('button', { name: '+ Create “Skyr”' }).click()
      await page.getByLabel('Category').selectOption({ label: 'Dairy' })
      await page.getByLabel('Calories', { exact: true }).fill('60')
      await page.getByLabel('Protein (g)').fill('60')
      await page.getByLabel('Carbs (g)').fill('40')
      await page.getByLabel('Fat (g)').fill('1')
      await expect(page.getByText('Protein, carbs and fat can\'t add up to more than 100 g.')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Add to recipe' })).toBeDisabled()
      await page.getByLabel('Fat (g)').fill('0')
      await page.getByLabel('Fiber (g, optional)').fill('30')
      await expect(page.getByText('Protein, carbs and fat can\'t add up to more than 100 g.')).toBeHidden()
      await expect(page.getByRole('button', { name: 'Add to recipe' })).toBeEnabled()
    })
  })
}
