import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { THEMES, gotoReady, setTheme, shot, signIn } from '../helpers'

/**
 * Taps a muscle on the figure itself (the chip list below has buttons with the same names).
 * Clicks one side's shape: the centre of a left + right pair is the gap between them.
 */
const tapMuscle = (page: Page, muscle: string) => page.locator(`svg [data-muscle="${muscle}"] path`).first().click()

/**
 * Taps the figure at a point in the artwork's own units. The nape is two thin strips either side of the head, so the
 * centre of its shape lands on the head; tap inside the left strip instead.
 */
async function tapFigureAt(page: Page, x: number, y: number) {
  const point = await page.getByRole('group', { name: /^Body, / }).evaluate((svg, [x, y]) => {
    const p = new DOMPoint(x, y).matrixTransform((svg as SVGSVGElement).getScreenCTM()!)
    return { x: p.x, y: p.y }
  }, [x, y])
  await page.mouse.click(point.x, point.y)
}
const NAPE_POINT = [51.3, 12.8] as const

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

    test('upper chest: targets first, then exercises it assists in', async ({ page }, testInfo) => {
      await tapMuscle(page, 'upper_chest')
      const targets = page.getByRole('list', { name: 'Targets upper chest' })
      await expect(targets.getByText('Incline Barbell Press')).toBeVisible()
      await expect(targets.getByText('Decline Barbell Press')).toHaveCount(0)
      await expect(page.getByRole('list', { name: 'Also works upper chest' }).getByText('Dumbbell Front Raise')).toBeVisible()
      // The card says exactly which muscles the exercise trains.
      const incline = targets.getByRole('listitem').filter({ hasText: 'Incline Barbell Press' })
      await expect(incline).toContainText('Works: Upper chest, Front delts, Triceps (lateral head)')
      await shot(page, testInfo, 'body-upper-chest', theme)
    })

    test('mid & lower chest', async ({ page }, testInfo) => {
      await tapMuscle(page, 'lower_chest')
      const targets = page.getByRole('list', { name: 'Targets mid & lower chest' })
      await expect(targets.getByText('Decline Barbell Press')).toBeVisible()
      await expect(targets.getByText('Chest Dip')).toBeVisible()
      await expect(targets.getByText('Incline Barbell Press')).toHaveCount(0)
      await shot(page, testInfo, 'body-lower-chest', theme)
    })

    test('equipment filter', async ({ page }, testInfo) => {
      await tapMuscle(page, 'lower_chest')
      await page.getByRole('group', { name: 'Equipment' }).getByRole('button', { name: 'Gym' }).click()
      const targets = page.getByRole('list', { name: 'Targets mid & lower chest' })
      await expect(targets.getByText('Barbell Bench Press')).toHaveCount(0)
      await expect(targets.getByText('Dumbbell Bench Press')).toBeVisible()
      await shot(page, testInfo, 'body-lower-chest-no-gym', theme)
    })

    test('back view', async ({ page }, testInfo) => {
      await page.getByRole('radio', { name: 'Back' }).click()
      await tapMuscle(page, 'lats')
      await expect(page.getByRole('list', { name: 'Targets lats' }).getByText('Lat Pulldown')).toBeVisible()
      await shot(page, testInfo, 'body-back-lats', theme)
    })

    test('muscle chip turns the figure around', async ({ page }) => {
      await page.getByRole('group', { name: 'Legs' }).getByRole('button', { name: 'Soleus' }).click()
      await expect(page.getByRole('radio', { name: 'Back' })).toHaveAttribute('aria-checked', 'true')
      await expect(page.locator('svg [data-muscle="soleus"]')).toHaveAttribute('aria-pressed', 'true')
      await expect(page.getByRole('list', { name: 'Targets soleus' }).getByText('Seated Calf Raise')).toBeVisible()
    })

    test('muscle chips come from the catalog API', async ({ page }, testInfo) => {
      const areas = page.getByRole('region', { name: 'Body map' }).getByRole('group', { name: /^(Chest|Shoulders|Arms|Core|Back|Legs)$/ })
      await expect(areas).toHaveCount(6)
      await expect(areas.getByRole('button')).toHaveCount(30)
      await expect(page.getByRole('group', { name: 'Back', exact: true }).getByRole('button').first()).toHaveText('Neck')
      const arms = page.getByRole('group', { name: 'Arms' })
      await expect(arms.getByRole('button', { name: 'Brachioradialis & forearm extensors' })).toBeVisible()
      await arms.scrollIntoViewIfNeeded()
      await shot(page, testInfo, 'body-muscle-chips', theme)
    })

    test('neck on the back view', async ({ page }, testInfo) => {
      await page.getByRole('radio', { name: 'Back' }).click()
      await tapFigureAt(page, ...NAPE_POINT)
      await expect(page.locator('svg [data-muscle="neck"]')).toHaveAttribute('aria-pressed', 'true')
      await expect(page.getByRole('heading', { name: 'Neck', exact: true })).toBeVisible()
      await expect(page.getByText('No exercises for this filter.')).toBeVisible()
      await shot(page, testInfo, 'body-neck', theme)
    })

    test('neck on the front view', async ({ page }) => {
      await tapMuscle(page, 'neck')
      await expect(page.getByRole('radio', { name: 'Front' })).toHaveAttribute('aria-checked', 'true')
      await expect(page.locator('svg [data-muscle="neck"]')).toHaveAttribute('aria-pressed', 'true')
      await expect(page.getByRole('heading', { name: 'Neck', exact: true })).toBeVisible()
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
      await expect(page.getByRole('list', { name: 'Targets lats' }).getByText('Added').first()).toBeVisible()
      await shot(page, testInfo, 'body-added', theme)
      await page.getByRole('link', { name: 'See today\'s workout →' }).click()
      await expect(page).toHaveURL(/\/train$/)
      await expect(page.getByRole('heading', { name: 'Pull-up', exact: true })).toBeVisible()
      await expect(page.getByText('Bench Press', { exact: true })).toBeVisible()
      await shot(page, testInfo, 'body-train-with-added', theme)
    })
  })
}
