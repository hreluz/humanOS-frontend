import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { THEMES, gotoReady, setTheme, shot, signIn } from '../helpers'

/** Taps a muscle on the figure itself (the chip list below has buttons with the same names). */
const tapMuscle = (page: Page, muscle: string) => page.locator(`svg [data-muscle="${muscle}"]`).click()

test.beforeEach(async ({ context, baseURL }) => {
  await signIn(context, baseURL!)
})

for (const theme of THEMES) {
  test.describe(`body map (${theme})`, () => {
    test.beforeEach(async ({ context, page, baseURL }) => {
      await setTheme(context, theme, baseURL!)
      await gotoReady(page, '/body')
    })

    test('empty state', async ({ page }, testInfo) => {
      await expect(page.getByText('Tap a muscle to see exercises')).toBeVisible()
      await shot(page, testInfo, 'body-empty', theme)
    })

    test('chest exercises', async ({ page }, testInfo) => {
      await tapMuscle(page, 'chest')
      const list = page.getByRole('list', { name: 'Chest exercises' })
      await expect(list.getByText('Barbell Bench Press')).toBeVisible()
      await expect(list.getByText('Push-up', { exact: true })).toBeVisible()
      await shot(page, testInfo, 'body-chest', theme)
    })

    test('equipment filter', async ({ page }, testInfo) => {
      await tapMuscle(page, 'chest')
      await page.getByRole('group', { name: 'Equipment' }).getByRole('button', { name: 'Gym' }).click()
      const list = page.getByRole('list', { name: 'Chest exercises' })
      await expect(list.getByText('Barbell Bench Press')).toHaveCount(0)
      await expect(list.getByText('Dumbbell Bench Press')).toBeVisible()
      await shot(page, testInfo, 'body-chest-no-gym', theme)
    })

    test('back view', async ({ page }, testInfo) => {
      await page.getByRole('radio', { name: 'Back' }).click()
      await tapMuscle(page, 'lats')
      await expect(page.getByRole('list', { name: 'Lats exercises' }).getByText('Lat Pulldown')).toBeVisible()
      await shot(page, testInfo, 'body-back-lats', theme)
    })

    test('add to today\'s workout', async ({ page }, testInfo) => {
      await page.getByRole('radio', { name: 'Back' }).click()
      await tapMuscle(page, 'lats')
      await page.getByRole('button', { name: 'Add Pull-up to today\'s workout' }).click()
      await expect(page.getByRole('list', { name: 'Lats exercises' }).getByText('Added').first()).toBeVisible()
      await shot(page, testInfo, 'body-added', theme)
      await page.getByRole('link', { name: 'See today\'s workout →' }).click()
      await expect(page.getByRole('heading', { name: 'Pull-up' })).toBeVisible()
      await expect(page.getByText('Bench Press', { exact: true })).toBeVisible()
      await shot(page, testInfo, 'body-train-with-added', theme)
    })
  })
}
