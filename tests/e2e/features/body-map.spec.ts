import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { THEMES, gotoReady, setTheme, shot, signIn } from '../helpers'

/** Taps a muscle on the figure itself (the chip list below has buttons with the same names). */
const tapMuscle = (page: Page, muscle: string) => page.locator(`svg [data-muscle="${muscle}"]`).click()

/**
 * Exercise photos are hot-linked from free-exercise-db. Serve a labelled placeholder instead so the test doesn't
 * depend on the network; set E2E_REAL_PHOTOS=1 to see the real photos in the screenshots.
 */
async function stubPhotos(page: Page) {
  if (process.env.E2E_REAL_PHOTOS) return
  await page.route('https://raw.githubusercontent.com/yuhonas/free-exercise-db/**', (route) => {
    const [id, file] = new URL(route.request().url()).pathname.split('/').slice(-2)
    const body = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#dfe3ea"/><text x="300" y="200" font-family="sans-serif" font-size="22" text-anchor="middle" fill="#555">${id} / ${file}</text></svg>`
    return route.fulfill({ contentType: 'image/svg+xml', body })
  })
}

test.beforeEach(async ({ context, page, baseURL }) => {
  await signIn(context, baseURL!)
  await stubPhotos(page)
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

    test('photo viewer', async ({ page }, testInfo) => {
      await page.getByRole('radio', { name: 'Back' }).click()
      await tapMuscle(page, 'lats')
      await page.getByRole('button', { name: 'View photos of Lat Pulldown' }).click()
      const dialog = page.getByRole('dialog', { name: 'Lat Pulldown photos' })
      await expect(dialog.getByText('Start', { exact: true })).toBeVisible()
      await expect(dialog.getByText('1 / 10')).toBeVisible()
      await shot(page, testInfo, 'body-photos-start', theme)

      await dialog.getByRole('button', { name: 'Next photo' }).click()
      await expect(dialog.getByText('2 / 10')).toBeVisible()
      await page.keyboard.press('ArrowRight')
      await expect(dialog.getByText('Close-Grip Front Lat Pulldown · start')).toBeVisible()
      await shot(page, testInfo, 'body-photos-variant', theme)

      await dialog.getByRole('button', { name: /^Photo 10:/ }).click()
      await expect(dialog.getByText('10 / 10')).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(dialog).toHaveCount(0)
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
