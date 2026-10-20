import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { THEMES, addIngredients, gotoReady, setTheme, shot, signIn } from '../helpers'

/** Opens the create form from the recipe builder's picker and fills the required fields: 100 g, 595 kcal. */
const openTahiniForm = async (page: Page) => {
  await page.getByLabel('Add an ingredient').fill('Tahini')
  await page.getByRole('button', { name: '+ Create “Tahini”' }).click()
  await page.getByLabel('Calories (kcal)').fill('595')
}

test.beforeEach(async ({ context, baseURL }) => {
  await signIn(context, baseURL!)
})

for (const theme of THEMES) {
  test.describe(`custom ingredient price (${theme})`, () => {
    test.beforeEach(async ({ context, page, baseURL }) => {
      await setTheme(context, theme, baseURL!)
      await gotoReady(page, '/food/recipes/new')
    })

    test('the price label follows the nutrition portion', async ({ page }, testInfo) => {
      await openTahiniForm(page)
      await expect(page.getByLabel('Price (USD, per 100 g)')).toBeVisible()
      await page.getByLabel('Price (USD, per 100 g)').fill('2.50')
      // Phones scroll the form inside the page; bring the field and the save button into the shot.
      await page.getByRole('button', { name: 'Add to recipe' }).scrollIntoViewIfNeeded()
      await shot(page, testInfo, 'price-form', theme)
      await page.getByLabel('Nutrition per').fill('1')
      await page.getByRole('radio', { name: 'piece' }).click()
      await expect(page.getByLabel('Price (USD, per 1 piece)')).toHaveValue('2.50')
      await shot(page, testInfo, 'price-form-piece', theme)
    })

    test('an invalid price shows an error and blocks saving', async ({ page }, testInfo) => {
      await openTahiniForm(page)
      const price = page.getByLabel(/^Price \(USD/)
      await price.fill('abc')
      await price.blur()
      await expect(page.getByText('Enter a price like 1.10.')).toBeVisible()
      await expect(price).toHaveAttribute('aria-invalid', 'true')
      await expect(page.getByText('Add a valid price to save.')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Add to recipe' })).toBeDisabled()
      await page.getByRole('button', { name: 'Add to recipe' }).scrollIntoViewIfNeeded()
      await shot(page, testInfo, 'price-invalid', theme)
    })

    test('the saved card shows the price', async ({ page }, testInfo) => {
      await gotoReady(page, '/food')
      await page.getByRole('button', { name: 'New ingredient' }).click()
      const dialog = page.getByRole('dialog')
      await dialog.getByLabel('Ingredient name').fill('Tahini')
      await dialog.getByLabel('Calories (kcal)').fill('595')
      await dialog.getByLabel(/^Price \(USD/).fill('2.50')
      await dialog.getByRole('button', { name: 'Save ingredient' }).click()
      await expect(dialog.getByText('Tahini saved to My foods.')).toBeVisible()
      await expect(dialog.getByText('100 g · 595 kcal · $2.50')).toBeVisible()
      await shot(page, testInfo, 'price-saved-card', theme)
    })

    test('a priced custom ingredient counts in the recipe cost', async ({ page }, testInfo) => {
      await openTahiniForm(page)
      await page.getByLabel(/^Price \(USD/).fill('2.50')
      await page.getByRole('button', { name: 'Add to recipe' }).click()
      await expect(page.getByTestId('line-cost')).toHaveText('$2.50')
      await expect(page.getByText(/without a price/)).toHaveCount(0)
      if (testInfo.project.name === 'desktop') await expect(page.getByTestId('per-serving-cost')).toHaveText('$2.50')
      await page.getByLabel('Add an ingredient').blur()
      await shot(page, testInfo, 'price-recipe-line', theme)
    })

    test('a custom ingredient with a blank price is still excluded', async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'desktop', 'the note is on the desktop card only')
      // The note needs a priced ingredient: a recipe of only unpriced ones shows no cost at all (SPEC 03).
      await addIngredients(page, 'Chicken breast, boiled')
      await openTahiniForm(page)
      await page.getByRole('button', { name: 'Add to recipe' }).click()
      await expect(page.getByText('Tahini', { exact: true })).toBeVisible()
      await expect(page.getByTestId('line-cost')).toHaveCount(1)
      await expect(page.getByText('Excludes 1 ingredient without a price')).toBeVisible()
      await shot(page, testInfo, 'price-blank-note', theme)
    })
  })
}
