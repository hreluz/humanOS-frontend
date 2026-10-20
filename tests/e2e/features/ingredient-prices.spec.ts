import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { THEMES, addIngredients, gotoReady, setTheme, shot, signIn } from '../helpers'

// Mock prices: chicken breast, boiled is $1.10 per 100 g (step 10 g); a boiled egg is $0.40.
const CHICKEN = 'Chicken breast, boiled'
const EGG = 'Egg, boiled'

const createTahini = async (page: Page) => {
  await page.getByLabel('Add an ingredient').fill('Tahini')
  await page.getByRole('button', { name: '+ Create “Tahini”' }).click()
  await page.getByLabel('Nutrition per').fill('15')
  await page.getByLabel('Calories (kcal)').fill('90')
  await page.getByRole('button', { name: 'Add to recipe' }).click()
  await expect(page.getByText('Tahini', { exact: true })).toBeVisible()
}

test.beforeEach(async ({ context, baseURL }) => {
  await signIn(context, baseURL!)
})

for (const theme of THEMES) {
  test.describe(`ingredient prices (${theme})`, () => {
    test.beforeEach(async ({ context, page, baseURL }) => {
      await setTheme(context, theme, baseURL!)
      await gotoReady(page, '/food/recipes/new')
    })

    test('picker rows show the catalog price', async ({ page }, testInfo) => {
      await page.getByLabel('Add an ingredient').fill('chicken breast')
      await expect(page.getByRole('button', { name: new RegExp(`^${CHICKEN}.*· \\$1\\.10$`) })).toBeVisible()
      await shot(page, testInfo, 'prices-picker', theme)
    })

    test('a line costs its amount and follows the stepper', async ({ page }, testInfo) => {
      await addIngredients(page, CHICKEN)
      const lineCost = page.getByTestId('line-cost')
      await expect(lineCost).toHaveText('$1.10')
      await page.getByRole('button', { name: `More ${CHICKEN}` }).click()
      await expect(lineCost).toHaveText('$1.21')
      await page.getByLabel('Add an ingredient').blur()
      await shot(page, testInfo, 'prices-line', theme)
    })

    test('summary splits the cost across servings', async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'desktop', 'summary card is desktop only')
      await addIngredients(page, CHICKEN, EGG)
      await page.getByRole('button', { name: 'More servings' }).click()
      await expect(page.getByTestId('per-serving-cost')).toHaveText('$0.75')
      await expect(page.getByTestId('whole-recipe-cost')).toHaveText('$1.50')
      await page.getByLabel('Add an ingredient').blur()
      await shot(page, testInfo, 'prices-summary', theme)
    })

    test('a custom ingredient is excluded with a note', async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'desktop', 'the note is on the desktop card only')
      await addIngredients(page, CHICKEN)
      await createTahini(page)
      await expect(page.getByTestId('line-cost')).toHaveCount(1)
      await expect(page.getByTestId('per-serving-cost')).toHaveText('$1.10')
      await expect(page.getByText('Excludes 1 ingredient without a price')).toBeVisible()
      await shot(page, testInfo, 'prices-unpriced-note', theme)
    })

    test('only custom ingredients show no cost', async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'desktop', 'summary card is desktop only')
      await createTahini(page)
      await expect(page.getByTestId('per-serving-cost')).toHaveCount(0)
      await expect(page.getByTestId('line-cost')).toHaveCount(0)
      await expect(page.getByText(/without a price/)).toHaveCount(0)
    })

    test('phone bar shows the cost per serving', async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'mobile', 'pinned bar is mobile only')
      // Without a name the bar shows the save hint instead of the summary.
      await page.getByLabel('Recipe name').fill('Chicken & Eggs')
      await addIngredients(page, CHICKEN, EGG)
      await page.getByRole('button', { name: 'More servings' }).click()
      await page.getByLabel('Add an ingredient').blur()
      await expect(page.getByTestId('per-serving-cost-bar')).toHaveText('$0.75')
      await shot(page, testInfo, 'prices-phone-bar', theme)
    })
  })
}
