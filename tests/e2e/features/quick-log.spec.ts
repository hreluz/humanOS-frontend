import { expect, test } from '@playwright/test'
import { THEMES, gotoReady, openQuickLog, setTheme, shot, signIn } from '../helpers'

test.beforeEach(async ({ context, baseURL }) => {
  await signIn(context, baseURL!)
})

for (const theme of THEMES) {
  test.describe(`quick log (${theme})`, () => {
    test.beforeEach(async ({ context, baseURL }) => {
      await setTheme(context, theme, baseURL!)
    })

    test('food with goal impact', async ({ page }, testInfo) => {
      await gotoReady(page, '/food')
      await page.getByRole('button', { name: '+ Log food' }).click()
      const dialog = page.getByRole('dialog')
      await dialog.getByRole('button', { name: 'Add Chicken breast, boiled' }).click()
      await dialog.getByRole('button', { name: 'Add Egg, boiled' }).click()
      await dialog.getByRole('button', { name: 'More Egg, boiled' }).click()
      await expect(dialog.getByText('Moves your goals')).toBeVisible()
      await shot(page, testInfo, 'quick-log-food', theme)
    })

    test('activity with goal impact', async ({ page }, testInfo) => {
      await gotoReady(page, '/goals')
      await openQuickLog(page)
      const dialog = page.getByRole('dialog')
      await dialog.getByRole('radio', { name: 'Activity' }).click()
      await dialog.getByRole('radio', { name: /Cycling/ }).click()
      await expect(dialog.getByText('Moves your goals')).toBeVisible()
      await shot(page, testInfo, 'quick-log-activity', theme)
    })

    test('water', async ({ page }, testInfo) => {
      await gotoReady(page, '/')
      await openQuickLog(page)
      const dialog = page.getByRole('dialog')
      await dialog.getByRole('radio', { name: 'Water' }).click()
      await dialog.getByRole('radio', { name: /500 ml/ }).click()
      await expect(dialog.getByText('Moves your goals')).toBeVisible()
      await shot(page, testInfo, 'quick-log-water', theme)
    })

    test('typed food amount', async ({ page }, testInfo) => {
      await gotoReady(page, '/food')
      await page.getByRole('button', { name: '+ Log food' }).click()
      const dialog = page.getByRole('dialog')
      await dialog.getByRole('button', { name: 'Add Chicken breast, boiled' }).click()
      await dialog.getByLabel('Chicken breast, boiled amount').fill('96')
      await expect(dialog.getByText('144 kcal · 28.8g protein')).toBeVisible()
      await expect(dialog.getByText('118g → 147g of 170g')).toBeVisible()
      await shot(page, testInfo, 'quick-log-typed-amount', theme)
      await dialog.getByRole('button', { name: 'Log 1 item' }).click()
      await expect(dialog).toBeHidden()
      await expect(page.getByText('Chicken breast, boiled, 96 g')).toBeVisible()
    })

    test('typed steps', async ({ page }) => {
      await gotoReady(page, '/goals')
      await openQuickLog(page)
      const dialog = page.getByRole('dialog')
      await dialog.getByRole('radio', { name: 'Activity' }).click()
      await dialog.getByRole('radio', { name: /Walking/ }).click()
      const steps = dialog.getByLabel('Walking amount')
      await steps.fill('1001')
      await dialog.getByRole('button', { name: 'More Walking' }).click()
      await expect(steps).toHaveValue('1501')
      await steps.fill('abc')
      await steps.blur()
      await expect(steps).toHaveValue('1501')
      await steps.fill('1001')
      await dialog.getByRole('button', { name: 'Log walking' }).click()
      await expect(dialog).toBeHidden()
      await expect(page.getByText('Walk 10,000 steps').locator('..')).toContainText('7,201 today')
    })

    test('edited activity calories', async ({ page }, testInfo) => {
      await gotoReady(page, '/goals')
      await openQuickLog(page)
      const dialog = page.getByRole('dialog')
      await dialog.getByRole('radio', { name: 'Activity' }).click()
      await dialog.getByRole('radio', { name: /Walking/ }).click()
      const kcal = dialog.getByLabel('Calories burned amount')
      const estimate = await kcal.inputValue()
      await kcal.fill('70')
      await expect(dialog.getByText('341 kcal → 411 kcal of 500 kcal')).toBeVisible()
      await expect(dialog.getByText(`Changed from the ${estimate} kcal estimate.`)).toBeVisible()
      await shot(page, testInfo, 'quick-log-edited-kcal', theme)

      // The edited number stays put when the steps change, until the estimate is restored.
      await dialog.getByRole('button', { name: 'More Walking' }).click()
      await expect(kcal).toHaveValue('70')
      await dialog.getByRole('button', { name: 'Use estimate' }).click()
      await expect(kcal).not.toHaveValue('70')
      await dialog.getByRole('button', { name: 'Less Walking' }).click()
      await expect(kcal).toHaveValue(estimate)

      await kcal.fill('70')
      await kcal.blur()
      await dialog.getByRole('button', { name: 'Log walking' }).click()
      await expect(dialog).toBeHidden()
      await page.getByRole('link', { name: 'Train' }).first().click()
      await expect(page.getByText(/1,000 steps · 70 kcal · logged at/)).toBeVisible()
    })

    test('home timeline after logging', async ({ page }, testInfo) => {
      await gotoReady(page, '/')
      await openQuickLog(page)
      const dialog = page.getByRole('dialog')
      await dialog.getByRole('button', { name: 'Add Chicken breast, boiled' }).click()
      await dialog.getByRole('button', { name: 'Log 1 item' }).click()
      await expect(dialog).toBeHidden()
      await expect(page.getByRole('region', { name: 'Logged today' }).getByText('Chicken breast, boiled')).toBeVisible()
      await shot(page, testInfo, 'home-after-log', theme)
    })
  })
}
