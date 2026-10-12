import { expect, test } from '@playwright/test'
import { THEMES, gotoReady, setTheme, shot, signIn } from '../helpers'

test.beforeEach(async ({ context, baseURL }) => {
  await signIn(context, baseURL!)
})

for (const theme of THEMES) {
  test.describe(`recipe ingredients collapse (${theme})`, () => {
    test.beforeEach(async ({ context, page, baseURL }) => {
      await setTheme(context, theme, baseURL!)
      await gotoReady(page, '/food')
    })

    test('collapsed and expanded', async ({ page }, testInfo) => {
      await page.getByRole('button', { name: 'New recipe' }).click()
      const dialog = page.getByRole('dialog')
      const toggle = dialog.getByRole('button', { name: /^Ingredients/ })
      await expect(toggle).toHaveAttribute('aria-expanded', 'false')
      await shot(page, testInfo, 'recipe-ingredients-collapsed', theme)
      await toggle.click()
      await expect(dialog.getByRole('button', { name: 'Remove Olive oil' })).toBeVisible()
      await shot(page, testInfo, 'recipe-ingredients-expanded', theme)
    })
  })
}
