import { expect, test } from '@playwright/test'
import { THEMES, gotoReady, setTheme, shot, signIn } from '../helpers'

test.beforeEach(async ({ context, baseURL }) => {
  await signIn(context, baseURL!)
})

for (const theme of THEMES) {
  test.describe(`recipe log edit (${theme})`, () => {
    test.beforeEach(async ({ context, baseURL }) => {
      await setTheme(context, theme, baseURL!)
    })

    test('edit ingredients while logging a recipe', async ({ page }, testInfo) => {
      await gotoReady(page, '/food')
      await page.getByRole('button', { name: '+ Log food' }).click()
      const dialog = page.getByRole('dialog')
      await dialog.getByLabel('Search foods').fill('overnight oats')
      await dialog.getByRole('button', { name: 'Add Overnight oats' }).click()
      await expect(dialog.getByText(/^275 kcal · /)).toBeVisible()

      await dialog.getByRole('button', { name: 'Ingredients' }).click()
      await dialog.getByRole('button', { name: 'More Rolled oats' }).click()
      await dialog.getByRole('button', { name: 'More Rolled oats' }).click()
      await dialog.getByRole('button', { name: 'Remove Honey' }).click()
      await expect(dialog.getByText('+20 g from the recipe')).toBeVisible()
      await expect(dialog.getByText(/^329 kcal · /)).toBeVisible()
      await expect(dialog.getByRole('button', { name: 'Ingredients, edited' })).toBeVisible()
      await shot(page, testInfo, 'recipe-log-edited', theme)

      // More servings keep the edit's proportions.
      await dialog.getByRole('button', { name: 'More Overnight oats' }).click()
      await expect(dialog.getByLabel('Rolled oats amount')).toHaveValue('120')

      await dialog.getByRole('button', { name: 'Use recipe' }).click()
      await expect(dialog.getByLabel('Rolled oats amount')).toHaveValue('80')
      await expect(dialog.getByLabel('Honey amount')).toHaveValue('14')
      await expect(dialog.getByRole('button', { name: 'Use recipe' })).toBeHidden()

      await dialog.getByRole('button', { name: 'Less Overnight oats' }).click()
      await dialog.getByRole('button', { name: 'Remove Honey' }).click()
      await dialog.getByRole('button', { name: 'Log 1 item' }).click()
      await expect(dialog).toBeHidden()
      await expect(page.getByText(/Overnight oats/).first()).toBeVisible()

      // The saved recipe is untouched: adding it again starts from the recipe's amounts.
      await page.getByRole('button', { name: '+ Log food' }).click()
      await dialog.getByLabel('Search foods').fill('overnight oats')
      await dialog.getByRole('button', { name: 'Add Overnight oats' }).click()
      await dialog.getByRole('button', { name: 'Ingredients' }).click()
      await expect(dialog.getByLabel('Honey amount')).toHaveValue('7')
      await shot(page, testInfo, 'recipe-log-expanded', theme)
    })

    test('ingredient amounts on the new recipe page', async ({ page }, testInfo) => {
      await gotoReady(page, '/food/recipes/new')
      await page.getByLabel('Recipe name').fill('Big oats')
      await page.getByLabel('Add an ingredient').fill('rolled oats')
      await page.getByRole('button', { name: /^Rolled oats/ }).click()
      await page.getByRole('button', { name: 'More Rolled oats' }).click()
      await page.getByRole('button', { name: 'More Rolled oats' }).click()
      await expect(page.getByLabel('Rolled oats amount')).toHaveValue('60')
      await shot(page, testInfo, 'recipe-page-amounts', theme)
      await page.getByRole('button', { name: 'Save recipe' }).filter({ visible: true }).click()
      await expect(page).toHaveURL(/\/food$/)

      await page.getByRole('button', { name: '+ Log food' }).click()
      const dialog = page.getByRole('dialog')
      await dialog.getByLabel('Search foods').fill('big oats')
      await dialog.getByRole('button', { name: 'Add Big oats' }).click()
      await expect(dialog.getByText(/^225 kcal · /)).toBeVisible()
      await dialog.getByRole('button', { name: 'Ingredients' }).click()
      await expect(dialog.getByLabel('Rolled oats amount')).toHaveValue('60')
    })
  })
}
