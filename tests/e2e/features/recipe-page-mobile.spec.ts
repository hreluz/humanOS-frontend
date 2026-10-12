import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { THEMES, gotoReady, setTheme, shot, signIn } from '../helpers'

// The page scrolls inside <main>, so full-page shots only show the top; scroll it explicitly.
const scrollMain = (page: Page, to: 'top' | 'bottom') =>
  page.locator('main').evaluate((el, end) => el.scrollTo(0, end === 'bottom' ? el.scrollHeight : 0), to)

test.beforeEach(async ({ context, baseURL }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile layout only')
  await signIn(context, baseURL!)
})

for (const theme of THEMES) {
  test.describe(`recipe page mobile (${theme})`, () => {
    test.beforeEach(async ({ context, page, baseURL }) => {
      await setTheme(context, theme, baseURL!)
      await gotoReady(page, '/food/recipes/new')
    })

    test('scrolled to the end', async ({ page }, testInfo) => {
      await scrollMain(page, 'bottom')
      await expect(page.getByText(/^\d+g protein · \d+g carbs$/).filter({ visible: true })).toBeInViewport()
      await shot(page, testInfo, 'recipe-mobile-end', theme)
    })

    test('save disabled hint', async ({ page }, testInfo) => {
      await page.getByLabel('Recipe name').fill('')
      await page.getByLabel('Recipe name').blur()
      await shot(page, testInfo, 'recipe-mobile-save-hint', theme)
    })

    test('after picking an ingredient', async ({ page }, testInfo) => {
      await page.getByLabel('Add an ingredient').fill('whey')
      await page.getByRole('button', { name: /^Whey protein/ }).click()
      await expect(page.getByText('4 items')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Save recipe' })).toBeVisible()
      await shot(page, testInfo, 'recipe-mobile-picked', theme)
    })

    test('create form', async ({ page }, testInfo) => {
      await page.getByLabel('Add an ingredient').fill('Tahini')
      await page.getByRole('button', { name: '+ Create “Tahini”' }).click()
      await expect(page.getByLabel('Calories (kcal)')).toBeFocused()
      await shot(page, testInfo, 'recipe-mobile-create', theme)
    })

    test('small phone', async ({ page }, testInfo) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await shot(page, testInfo, 'recipe-mobile-375', theme)
      await scrollMain(page, 'bottom')
      await shot(page, testInfo, 'recipe-mobile-375-end', theme)
    })
  })
}
