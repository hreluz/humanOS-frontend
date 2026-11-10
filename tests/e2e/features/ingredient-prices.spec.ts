import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { THEMES, addIngredients, gotoReady, setTheme, shot, signInAsNewUser } from '../helpers'

// Catalog ingredients are unpriced until the prices API (backend SPEC 24); only the user's own foods carry a price.

/** Creates a protein bar priced at $1.20 per 100 g, with a 45 g bar, from the recipe picker; it joins the recipe at 1 bar. */
async function addPricedBar(page: Page) {
  await page.getByLabel('Add an ingredient').fill('Protein bar, chocolate')
  await page.getByRole('button', { name: '+ Create “Protein bar, chocolate”' }).click()
  await page.getByLabel('Category').selectOption({ label: 'Supplements' })
  await page.getByLabel('Calories', { exact: true }).fill('380')
  await page.getByRole('button', { name: '+ Add portion' }).click()
  await page.getByLabel('Portion 1 name').fill('1 bar')
  await page.getByLabel('Portion 1 grams').fill('45')
  await page.getByLabel('Price (USD, per 100 g)').fill('1.20')
  await page.getByRole('button', { name: 'Add to recipe' }).click()
  await expect(page.getByTestId('line-cost')).toHaveText('$0.54')
}

for (const theme of THEMES) {
  test.describe(`ingredient prices (${theme})`, () => {
    test.beforeEach(async ({ context, page, baseURL }) => {
      await signInAsNewUser(context, baseURL!, 'prices')
      await setTheme(context, theme, baseURL!)
      await gotoReady(page, '/food/recipes/new')
    })

    test('catalog picker rows show no price', async ({ page }, testInfo) => {
      await page.getByLabel('Add an ingredient').fill('banana')
      const row = page.getByRole('button', { name: /^Banana/ })
      await expect(row).toContainText('Fruit · 100 g · 97 kcal')
      await expect(row).not.toContainText('$')
      await shot(page, testInfo, 'prices-picker', theme)
    })

    test('a line cost follows the stepper', async ({ page }, testInfo) => {
      await addPricedBar(page)
      await page.getByRole('button', { name: 'More Protein bar, chocolate' }).click()
      await expect(page.getByTestId('line-cost')).toHaveText('$1.08')
      await page.getByLabel('Unit for Protein bar, chocolate').selectOption({ label: 'g' })
      await expect(page.getByTestId('line-cost')).toHaveText('$1.20')
      await page.getByLabel('Add an ingredient').blur()
      await shot(page, testInfo, 'prices-line', theme)
    })

    test('a catalog line is excluded with a note', async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'desktop', 'the note is on the desktop card only')
      await addPricedBar(page)
      await addIngredients(page, 'Banana')
      await expect(page.getByTestId('line-cost')).toHaveCount(1)
      await expect(page.getByTestId('per-serving-cost')).toHaveText('$0.54')
      await expect(page.getByText('Excludes 1 ingredient without a price')).toBeVisible()
      await page.getByRole('button', { name: 'More servings' }).click()
      await expect(page.getByTestId('per-serving-cost')).toHaveText('$0.27')
      await expect(page.getByTestId('whole-recipe-cost')).toHaveText('$0.54')
      await page.getByLabel('Add an ingredient').blur()
      await shot(page, testInfo, 'prices-unpriced-note', theme)
    })

    test('only catalog ingredients show no cost', async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'desktop', 'summary card is desktop only')
      await addIngredients(page, 'Banana')
      await expect(page.getByTestId('per-serving-cost')).toHaveCount(0)
      await expect(page.getByTestId('line-cost')).toHaveCount(0)
      await expect(page.getByText(/without a price/)).toHaveCount(0)
    })

    test('phone bar shows the cost per serving', async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'mobile', 'pinned bar is mobile only')
      // Without a name the bar shows the save hint instead of the summary.
      await page.getByLabel('Recipe name').fill('Bar & banana')
      await addPricedBar(page)
      await addIngredients(page, 'Banana')
      await page.getByRole('button', { name: 'More servings' }).click()
      await page.getByLabel('Add an ingredient').blur()
      await expect(page.getByTestId('per-serving-cost-bar')).toHaveText('$0.27')
      await shot(page, testInfo, 'prices-phone-bar', theme)
    })
  })
}
