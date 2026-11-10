import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { THEMES, gotoReady, setTheme, shot, signIn, signInAsNewUser } from '../helpers'

/** Opens the create form from the recipe builder's picker and fills the required fields of a protein bar. */
const openBarForm = async (page: Page) => {
  await page.getByLabel('Add an ingredient').fill('Protein bar, chocolate')
  await page.getByRole('button', { name: '+ Create “Protein bar, chocolate”' }).click()
  await page.getByLabel('Category').selectOption({ label: 'Supplements' })
  await page.getByLabel('Calories', { exact: true }).fill('380')
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

    test('the price is per 100 g', async ({ page }, testInfo) => {
      await openBarForm(page)
      await page.getByLabel('Price (USD, per 100 g)').fill('1.20')
      // Phones scroll the form inside the page; bring the field and the save button into the shot.
      await page.getByRole('button', { name: 'Add to recipe' }).scrollIntoViewIfNeeded()
      await shot(page, testInfo, 'price-form', theme)
    })

    test('an invalid price shows an error and blocks saving', async ({ page }, testInfo) => {
      await openBarForm(page)
      const price = page.getByLabel('Price (USD, per 100 g)')
      await price.fill('abc')
      await price.blur()
      await expect(page.getByText('Enter a price like 1.10.')).toBeVisible()
      await expect(price).toHaveAttribute('aria-invalid', 'true')
      await expect(page.getByText('Add a valid price to save.')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Add to recipe' })).toBeDisabled()
      await page.getByRole('button', { name: 'Add to recipe' }).scrollIntoViewIfNeeded()
      await shot(page, testInfo, 'price-invalid', theme)
    })

    test('a priced food with a 45 g bar costs $0.54 a bar in a recipe', async ({ page, context, baseURL }, testInfo) => {
      await signInAsNewUser(context, baseURL!, 'price-bar')
      await gotoReady(page, '/food/recipes/new')
      await openBarForm(page)
      await page.getByRole('button', { name: '+ Add portion' }).click()
      await page.getByLabel('Portion 1 name').fill('1 bar')
      await page.getByLabel('Portion 1 grams').fill('45')
      await page.getByLabel('Price (USD, per 100 g)').fill('1.20')
      await page.getByRole('button', { name: 'Add to recipe' }).click()
      // It starts at 1 × its first portion: 45 g at $1.20 per 100 g.
      await expect(page.getByLabel('Unit for Protein bar, chocolate').locator('option:checked')).toHaveText('1 bar')
      await expect(page.getByTestId('line-cost')).toHaveText('$0.54')
      await expect(page.getByText(/without a price/)).toHaveCount(0)
      if (testInfo.project.name === 'desktop') await expect(page.getByTestId('per-serving-cost')).toHaveText('$0.54')
      await page.getByLabel('Add an ingredient').blur()
      await shot(page, testInfo, 'price-recipe-line', theme)
    })
  })
}
