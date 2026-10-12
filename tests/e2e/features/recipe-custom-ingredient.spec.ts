import { expect, test } from '@playwright/test'
import { THEMES, gotoReady, setTheme, shot, signIn } from '../helpers'

test.beforeEach(async ({ context, baseURL }) => {
  await signIn(context, baseURL!)
})

for (const theme of THEMES) {
  test.describe(`recipe custom ingredient (${theme})`, () => {
    test.beforeEach(async ({ context, page, baseURL }) => {
      await setTheme(context, theme, baseURL!)
      await gotoReady(page, '/food')
    })

    test('no match offers to create it', async ({ page }, testInfo) => {
      await page.getByRole('button', { name: 'New recipe' }).click()
      const dialog = page.getByRole('dialog')
      await dialog.getByRole('button', { name: '+ Add ingredient' }).click()
      await dialog.getByLabel('Search ingredients').fill('tahini')
      await expect(dialog.getByRole('button', { name: '+ Create “tahini”' })).toBeVisible()
      await shot(page, testInfo, 'recipe-ingredient-no-match', theme)
    })

    test('create form filled in', async ({ page }, testInfo) => {
      await page.getByRole('button', { name: 'New recipe' }).click()
      const dialog = page.getByRole('dialog')
      await dialog.getByRole('button', { name: '+ Add ingredient' }).click()
      await dialog.getByLabel('Search ingredients').fill('Tahini')
      await dialog.getByRole('button', { name: '+ Create “Tahini”' }).click()
      await dialog.getByLabel('Nutrition per').fill('15')
      await dialog.getByLabel('Calories (kcal)').fill('90')
      await dialog.getByLabel('Protein (g)').fill('2.6')
      await dialog.getByLabel('Carbs (g)').fill('3.2')
      await dialog.getByLabel('Fat (g)').fill('8')
      await expect(dialog.getByRole('button', { name: 'Add to recipe' })).toBeEnabled()
      await shot(page, testInfo, 'recipe-ingredient-create', theme)
      await dialog.getByRole('button', { name: 'Add to recipe' }).click()
      await expect(dialog.getByText('Tahini', { exact: true })).toBeVisible()
      await shot(page, testInfo, 'recipe-ingredient-added', theme)
    })

    test('standalone from the Food page', async ({ page }, testInfo) => {
      await shot(page, testInfo, 'food-header', theme)
      await page.getByRole('button', { name: 'New ingredient' }).click()
      const dialog = page.getByRole('dialog')
      await dialog.getByLabel('Ingredient name').fill('Tahini')
      await dialog.getByLabel('Nutrition per').fill('15')
      await dialog.getByLabel('Calories (kcal)').fill('90')
      await shot(page, testInfo, 'ingredient-modal', theme)
      await dialog.getByRole('button', { name: 'Save ingredient' }).click()
      await expect(dialog.getByText('Tahini saved to My foods.')).toBeVisible()
      await shot(page, testInfo, 'ingredient-modal-saved', theme)
    })
  })
}
