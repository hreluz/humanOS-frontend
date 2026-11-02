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

/** The equipment tabs: one group at a time. */
const tool = (page: Page, name: string) => page.getByRole('radiogroup', { name: 'Equipment' }).getByRole('radio', { name, exact: true })

/** Every exercise card for a muscle, across the `Targets …` and `Also works …` lists. */
const cards = (page: Page, muscle: string) => page.getByRole('list', { name: new RegExp(`(Targets|Also works) ${muscle}$`) }).getByRole('listitem')

const EXERCISES_URL = /\/v1\/training\/exercises\?/

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

    test('tabs in API order with none picked, and a muscle alone asks for a tool', async ({ page }, testInfo) => {
      const requests: string[] = []
      page.on('request', (r) => {
        if (EXERCISES_URL.test(r.url())) requests.push(r.url())
      })
      const tabs = page.getByRole('radiogroup', { name: 'Equipment' }).getByRole('radio')
      await expect(tabs).toHaveText(['Gym', 'Dumbbell', 'Bodyweight', 'Kettlebell', 'Bands', 'Accessories'])
      for (const tab of await tabs.all()) await expect(tab).toHaveAttribute('aria-checked', 'false')
      await tapMuscle(page, 'lower_chest')
      await expect(page.getByText('Pick a type of equipment.')).toBeVisible()
      await shot(page, testInfo, 'body-pick-equipment', theme)
      expect(requests).toEqual([])
    })

    test('a tool alone still asks for a muscle', async ({ page }) => {
      const requests: string[] = []
      page.on('request', (r) => {
        if (EXERCISES_URL.test(r.url())) requests.push(r.url())
      })
      await tool(page, 'Gym').click()
      await expect(tool(page, 'Gym')).toHaveAttribute('aria-checked', 'true')
      await expect(page.getByText('Tap a muscle to see exercises')).toBeVisible()
      expect(requests).toEqual([])
    })

    test('a muscle and a tool list exercises: targets first, then the ones it assists in', async ({ page }, testInfo) => {
      await tapMuscle(page, 'lower_chest')
      const [request] = await Promise.all([page.waitForRequest(EXERCISES_URL), tool(page, 'Gym').click()])
      const query = new URL(request.url()).searchParams
      expect(query.get('muscle')).toBe('lower_chest')
      expect(query.getAll('equipment_group[]')).toEqual(['gym'])
      expect(query.get('page')).toBe('1')
      expect(query.get('per_page')).toBe('50')
      expect(await request.headerValue('authorization')).toMatch(/^Bearer /)

      const targets = page.getByRole('list', { name: 'Targets mid & lower chest' })
      const bench = targets.getByRole('listitem').filter({ has: page.getByRole('heading', { name: 'Barbell Bench Press', exact: true }) })
      await expect(bench).toContainText('Shoulder blades pinned back, bar to mid-chest.')
      await expect(bench).toContainText('Works: Mid & lower chest, Upper chest, Front delts')
      await expect(page.getByRole('heading', { level: 3 })).toHaveText(['Targets mid & lower chest', 'Also works mid & lower chest'])
      await shot(page, testInfo, 'body-lower-chest-gym', theme)
    })

    test('picking another tool replaces the first, and it stays when the muscle changes', async ({ page }) => {
      await tapMuscle(page, 'lower_chest')
      await tool(page, 'Gym').click()
      const targets = page.getByRole('list', { name: 'Targets mid & lower chest' })
      await expect(targets.getByText('Barbell Bench Press', { exact: true })).toBeVisible()

      await tool(page, 'Dumbbell').click()
      await expect(targets.getByText('Dumbbell Bench Press', { exact: true })).toBeVisible()
      await expect(targets.getByText('Barbell Bench Press', { exact: true })).toHaveCount(0)
      await expect(tool(page, 'Gym')).toHaveAttribute('aria-checked', 'false')
      await expect(tool(page, 'Dumbbell')).toHaveAttribute('aria-checked', 'true')

      await tapMuscle(page, 'upper_chest')
      await expect(tool(page, 'Dumbbell')).toHaveAttribute('aria-checked', 'true')
      await expect(page.getByRole('list', { name: 'Targets upper chest' })).toBeVisible()
    })

    test('kettlebell lists real exercises', async ({ page }, testInfo) => {
      await page.getByRole('radio', { name: 'Back' }).click()
      await tapMuscle(page, 'lats')
      await tool(page, 'Kettlebell').click()
      await expect(page.getByRole('list', { name: 'Targets lats' }).getByText('One-Arm Kettlebell Row', { exact: true })).toBeVisible()
      await shot(page, testInfo, 'body-kettlebell', theme)
    })

    test('no exercises for a muscle and tool', async ({ page }, testInfo) => {
      await page.getByRole('group', { name: 'Chest' }).getByRole('button', { name: 'Serratus' }).click()
      await tool(page, 'Kettlebell').click()
      await expect(page.getByText('No exercises for this filter.')).toBeVisible()
      await shot(page, testInfo, 'body-no-exercises', theme)
    })

    test('load more appends pages until the last one', async ({ page }, testInfo) => {
      await page.getByRole('radio', { name: 'Back' }).click()
      await tapMuscle(page, 'glute_max')
      await tool(page, 'Gym').click()
      const list = cards(page, 'glute max')
      const more = page.getByRole('button', { name: 'Load more' })
      await expect(list).toHaveCount(50)
      await more.scrollIntoViewIfNeeded()
      await shot(page, testInfo, 'body-load-more', theme)

      await more.click()
      await expect(list).toHaveCount(100)
      await more.click()
      await expect(list).not.toHaveCount(100)
      await expect(more).toHaveCount(0)
      const names = await list.getByRole('heading', { level: 4 }).allTextContents()
      expect(names.length).toBeGreaterThan(100)
      expect(new Set(names).size).toBe(names.length)
    })

    test('a failed first page offers a retry', async ({ page }, testInfo) => {
      await page.route(EXERCISES_URL, route => route.fulfill({ status: 500, json: { message: 'Server Error' } }))
      await tapMuscle(page, 'lower_chest')
      await tool(page, 'Gym').click()
      await expect(page.getByText('Couldn\'t load exercises.')).toBeVisible()
      await shot(page, testInfo, 'body-exercises-error', theme)

      await page.unroute(EXERCISES_URL)
      await page.getByRole('alert').filter({ hasText: 'Couldn\'t load exercises.' }).getByRole('button', { name: 'Retry' }).click()
      await expect(page.getByRole('list', { name: 'Targets mid & lower chest' }).getByText('Barbell Bench Press', { exact: true })).toBeVisible()
    })

    test('a failed next page keeps the list and offers a retry', async ({ page }, testInfo) => {
      await page.getByRole('radio', { name: 'Back' }).click()
      await tapMuscle(page, 'glute_max')
      await tool(page, 'Gym').click()
      const list = cards(page, 'glute max')
      await expect(list).toHaveCount(50)

      await page.route(EXERCISES_URL, route => route.fulfill({ status: 500, json: { message: 'Server Error' } }))
      await page.getByRole('button', { name: 'Load more' }).click()
      const alert = page.getByRole('alert').filter({ hasText: 'Couldn\'t load more exercises.' })
      await expect(alert).toBeVisible()
      await expect(list).toHaveCount(50)
      await alert.scrollIntoViewIfNeeded()
      await shot(page, testInfo, 'body-load-more-error', theme)

      await page.unroute(EXERCISES_URL)
      await alert.getByRole('button', { name: 'Retry' }).click()
      await expect(list).toHaveCount(100)
    })

    test('muscle chip turns the figure around', async ({ page }) => {
      await page.getByRole('group', { name: 'Legs' }).getByRole('button', { name: 'Soleus' }).click()
      await expect(page.getByRole('radio', { name: 'Back' })).toHaveAttribute('aria-checked', 'true')
      await expect(page.locator('svg [data-muscle="soleus"]')).toHaveAttribute('aria-pressed', 'true')
      await tool(page, 'Gym').click()
      await expect(page.getByRole('list', { name: 'Targets soleus' }).getByText('Seated Calf Raise', { exact: true })).toBeVisible()
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
      await tool(page, 'Bodyweight').click()
      await expect(page.getByRole('list', { name: 'Targets neck' }).getByText('Side Neck Stretch', { exact: true })).toBeVisible()
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
      await tool(page, 'Gym').click()
      await page.getByRole('button', { name: 'View photos of Lat Pulldown' }).click()
      const dialog = page.getByRole('dialog', { name: 'Lat Pulldown photos' })
      await expect(dialog.getByText('Start', { exact: true })).toBeVisible()
      await expect(dialog.getByText('1 / 6')).toBeVisible()
      await expect(dialog.getByText('free-exercise-db')).toBeVisible()
      await shot(page, testInfo, 'body-photos-start', theme)

      await dialog.getByRole('button', { name: 'Next photo' }).click()
      await expect(dialog.getByText('2 / 6')).toBeVisible()
      await page.keyboard.press('ArrowRight')
      await expect(dialog.getByText('Close-Grip Front Lat Pulldown · start')).toBeVisible()
      await shot(page, testInfo, 'body-photos-variant', theme)

      await dialog.getByRole('button', { name: /^Photo 6:/ }).click()
      await expect(dialog.getByText('6 / 6')).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(dialog).toHaveCount(0)
    })

    test('add to today\'s workout shows the group\'s API label', async ({ page }, testInfo) => {
      await page.getByRole('radio', { name: 'Back' }).click()
      await tapMuscle(page, 'lats')
      await tool(page, 'Gym').click()
      const card = page.getByRole('list', { name: 'Targets lats' }).getByRole('listitem').filter({ has: page.getByRole('heading', { name: 'Lat Pulldown', exact: true }) })
      await expect(card).toContainText('Gym')
      await page.getByRole('button', { name: 'Add Lat Pulldown to today\'s workout' }).click()
      await expect(card.getByText('Added')).toBeVisible()
      await shot(page, testInfo, 'body-added', theme)
      await page.getByRole('link', { name: 'See today\'s workout →' }).click()
      await expect(page).toHaveURL(/\/train$/)
      const entry = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Lat Pulldown', exact: true }) })
      await expect(entry).toContainText('Gym')
      await expect(page.getByText('Bench Press', { exact: true })).toBeVisible()
      await shot(page, testInfo, 'body-train-with-added', theme)
    })
  })
}
