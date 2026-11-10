import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { THEMES, expectLeftLog, gotoReady, logPage, openQuickLog, setTheme, shot, signIn, waitForImages } from '../helpers'

const EGG = 'Egg, whole, hard-boiled'
const BEEF = 'Beef chuck, braised'

/** Searches the catalog on /log and puts the exact match in the basket. */
async function addFood(page: Page, query: string, name: string) {
  await logPage(page).getByLabel('Search foods').fill(query)
  await logPage(page).getByRole('button', { name: `Add ${name}`, exact: true }).click()
}

test.beforeEach(async ({ context, baseURL }) => {
  await signIn(context, baseURL!)
})

for (const theme of THEMES) {
  test.describe(`quick log (${theme})`, () => {
    test.beforeEach(async ({ context, baseURL }) => {
      await setTheme(context, theme, baseURL!)
    })

    test('All needs 3 letters before it searches', async ({ page }) => {
      await gotoReady(page, '/food')
      await page.getByRole('link', { name: '+ Log food' }).click()
      const searches: string[] = []
      page.on('request', (r) => {
        if (r.url().includes('/v1/nutrition/ingredients?')) searches.push(r.url())
      })
      await expect(logPage(page).getByText('Type at least 3 letters to search.')).toBeVisible()
      await logPage(page).getByLabel('Search foods').fill('eg')
      await page.waitForTimeout(400)
      await expect(logPage(page).getByText('Type at least 3 letters to search.')).toBeVisible()
      expect(searches).toEqual([])
      await expect(logPage(page).getByRole('button', { name: 'All' })).toBeVisible()
      await expect(logPage(page).getByRole('button', { name: 'Recent' })).toBeVisible()
      await expect(logPage(page).getByRole('button', { name: 'My Foods' })).toBeVisible()
      await expect(logPage(page).getByRole('button', { name: 'Verified' })).toHaveCount(0)
    })

    test('egg lists the catalog entry with a thumbnail', async ({ page }, testInfo) => {
      await gotoReady(page, '/food')
      await page.getByRole('link', { name: '+ Log food' }).click()
      const searched = page.waitForRequest(r => r.url().includes('/v1/nutrition/ingredients?search=egg'))
      await logPage(page).getByLabel('Search foods').fill('egg')
      const request = await searched
      expect(request.headers().authorization).toMatch(/^Bearer /)
      const row = logPage(page).getByRole('button', { name: `Add ${EGG}`, exact: true }).locator('..')
      await expect(row).toContainText('Eggs · 100 g · 155 kcal')
      await expect(row.getByRole('button', { name: `Photos of ${EGG}` })).toBeVisible()
      await waitForImages(row)
      await shot(page, testInfo, 'log-search', theme)
    })

    test('an egg starts at 1 large egg, and the unit can change', async ({ page }, testInfo) => {
      await gotoReady(page, '/')
      await openQuickLog(page)
      await addFood(page, 'egg', EGG)
      const unit = logPage(page).getByLabel(`Unit for ${EGG}`)
      const amount = logPage(page).getByLabel(`${EGG} amount`)
      await expect(unit.locator('option')).toHaveText(['g', '1 large egg', '1 cup, chopped'])
      await expect(unit.locator('option:checked')).toHaveText('1 large egg')
      await expect(amount).toHaveValue('1')
      await expect(logPage(page).getByText('78 kcal · 6.3g protein')).toBeVisible()

      await unit.selectOption({ label: 'g' })
      await expect(amount).toHaveValue('100')
      await unit.selectOption({ label: '1 cup, chopped' })
      await expect(amount).toHaveValue('1')
      await unit.selectOption({ label: '1 large egg' })

      // Beef chuck has no portions: grams only, no picker.
      await addFood(page, 'beef chuck', BEEF)
      await expect(logPage(page).getByLabel(`${BEEF} amount`)).toHaveValue('100')
      await expect(logPage(page).getByLabel(`Unit for ${BEEF}`)).toHaveCount(0)
      await shot(page, testInfo, 'log-basket-portions', theme)
    })

    test('2 large eggs log as 100 g with 155 kcal on Today', async ({ page }) => {
      await gotoReady(page, '/')
      await openQuickLog(page)
      await addFood(page, 'egg', EGG)
      await logPage(page).getByRole('button', { name: `More ${EGG}` }).click()
      await logPage(page).getByRole('button', { name: 'Log 1 item' }).click()
      await expectLeftLog(page)
      const entry = page.getByRole('region', { name: 'Logged today' }).getByRole('listitem').filter({ hasText: EGG }).first()
      await expect(entry).toContainText('2 × 1 large egg (100 g) · 155 kcal')
    })

    test('food with goal impact', async ({ page }, testInfo) => {
      await gotoReady(page, '/food')
      await page.getByRole('link', { name: '+ Log food' }).click()
      await addFood(page, 'egg', EGG)
      await addFood(page, 'beef chuck', BEEF)
      await expect(logPage(page).getByText('Moves your goals')).toBeVisible()
      await shot(page, testInfo, 'quick-log-food', theme)
    })

    test('activity with goal impact', async ({ page }, testInfo) => {
      await gotoReady(page, '/goals')
      await openQuickLog(page)
      const dialog = logPage(page)
      await dialog.getByRole('radio', { name: 'Activity' }).click()
      await dialog.getByRole('radio', { name: /Cycling/ }).click()
      await expect(dialog.getByText('Moves your goals')).toBeVisible()
      await shot(page, testInfo, 'quick-log-activity', theme)
    })

    test('water', async ({ page }, testInfo) => {
      await gotoReady(page, '/')
      await openQuickLog(page)
      const dialog = logPage(page)
      await dialog.getByRole('radio', { name: 'Water' }).click()
      await dialog.getByRole('radio', { name: /500 ml/ }).click()
      await expect(dialog.getByText('Moves your goals')).toBeVisible()
      await shot(page, testInfo, 'quick-log-water', theme)
    })

    test('typed food amount', async ({ page }, testInfo) => {
      await gotoReady(page, '/food')
      await page.getByRole('link', { name: '+ Log food' }).click()
      const dialog = logPage(page)
      await addFood(page, 'beef chuck', BEEF)
      await dialog.getByLabel(`${BEEF} amount`).fill('96')
      // 309 kcal and 30.2 g protein per 100 g.
      await expect(dialog.getByText('297 kcal · 29g protein')).toBeVisible()
      await expect(dialog.getByText('118g → 147g of 170g')).toBeVisible()
      await shot(page, testInfo, 'quick-log-typed-amount', theme)
      await dialog.getByRole('button', { name: 'Log 1 item' }).click()
      await expectLeftLog(page)
      await expect(page.getByText(`${BEEF}, 96 g`)).toBeVisible()
    })

    test('typed steps', async ({ page }) => {
      await gotoReady(page, '/goals')
      await openQuickLog(page)
      const dialog = logPage(page)
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
      await expectLeftLog(page)
      await expect(page.getByText('Walk 10,000 steps').locator('..')).toContainText('7,201 today')
    })

    test('edited activity calories', async ({ page }, testInfo) => {
      await gotoReady(page, '/goals')
      await openQuickLog(page)
      const dialog = logPage(page)
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
      await expectLeftLog(page)
      await page.getByRole('link', { name: 'Train' }).first().click()
      await expect(page.getByText(/1,000 steps · 70 kcal · logged at/)).toBeVisible()
    })

    test('home timeline after logging', async ({ page }, testInfo) => {
      await gotoReady(page, '/')
      await openQuickLog(page)
      await addFood(page, 'beef chuck', BEEF)
      await logPage(page).getByRole('button', { name: 'Log 1 item' }).click()
      await expectLeftLog(page)
      await expect(page.getByRole('region', { name: 'Logged today' }).getByText(BEEF)).toBeVisible()
      await shot(page, testInfo, 'home-after-log', theme)
    })

    test('logged earlier today', async ({ page }, testInfo) => {
      await gotoReady(page, '/')
      await openQuickLog(page)
      const dialog = logPage(page)
      await expect(dialog.getByText('Right now')).toBeVisible()
      await dialog.getByRole('button', { name: /^Today, / }).click()
      await addFood(page, 'banana', 'Banana')
      await dialog.getByLabel('Time').fill('00:00')
      await dialog.getByLabel('Time').blur()
      await expect(dialog.getByRole('button', { name: 'Today, 12:00 AM' })).toBeVisible()
      await expect(dialog.getByRole('radio', { name: 'Snacks' })).toHaveAttribute('aria-checked', 'true')
      await expect(dialog.getByText('Moves your goals')).toBeVisible()
      await shot(page, testInfo, 'quick-log-time-today', theme)
      await dialog.getByRole('button', { name: 'Log 1 item' }).click()
      await expectLeftLog(page)
      await expect(page.getByRole('region', { name: 'Logged today' }).getByRole('listitem').filter({ hasText: 'Banana' }).first()).toContainText('12:00 AM')
    })

    test('logged to yesterday', async ({ page }, testInfo) => {
      await gotoReady(page, '/')
      await openQuickLog(page)
      const dialog = logPage(page)
      await dialog.getByRole('radio', { name: 'Water' }).click()
      await dialog.getByLabel('Water amount').fill('333')
      await dialog.getByRole('button', { name: /^Today, / }).click()
      await dialog.getByRole('radio', { name: 'Yesterday' }).click()
      await dialog.getByLabel('Time').fill('19:30')
      await dialog.getByLabel('Time').blur()
      await expect(dialog.getByRole('button', { name: 'Yesterday, 7:30 PM' })).toBeVisible()
      await expect(dialog.getByText("This counts for yesterday, so today's goals don't change.")).toBeVisible()
      await expect(dialog.getByText('Moves your goals')).toBeHidden()
      await shot(page, testInfo, 'quick-log-time-yesterday', theme)

      await dialog.getByRole('button', { name: 'Use right now' }).click()
      await expect(dialog.getByText('Right now')).toBeVisible()
      await expect(dialog.getByRole('button', { name: /^Today, / })).toBeFocused()
      await dialog.getByRole('radio', { name: 'Yesterday' }).click()
      await dialog.getByRole('button', { name: 'Log 333 ml water' }).click()
      await expectLeftLog(page)
      await expect(page.getByRole('region', { name: 'Logged today' })).not.toContainText('333 ml')
    })

    test('time later than now', async ({ page }) => {
      test.skip(new Date().getHours() === 23 && new Date().getMinutes() >= 58, 'no later time left today')
      await gotoReady(page, '/')
      await openQuickLog(page)
      const dialog = logPage(page)
      await dialog.getByRole('button', { name: /^Today, / }).click()
      const time = dialog.getByLabel('Time')
      await expect(dialog.getByText("Can't be later than now")).toBeHidden()
      await time.fill('23:59')
      await time.blur()
      await expect(dialog.getByText("Can't be later than now")).toBeVisible()
      await expect(time).not.toHaveValue('23:59')
    })

    test('meal follows the time', async ({ page }) => {
      await gotoReady(page, '/food')
      await page.getByRole('link', { name: '+ Log food' }).click()
      const dialog = logPage(page)
      await addFood(page, 'banana', 'Banana')
      await dialog.getByRole('button', { name: /^Today, / }).click()
      await dialog.getByRole('radio', { name: 'Yesterday' }).click()
      const time = dialog.getByLabel('Time')
      await time.fill('08:00')
      await time.blur()
      await expect(dialog.getByRole('radio', { name: 'Breakfast' })).toHaveAttribute('aria-checked', 'true')
      await dialog.getByRole('radio', { name: 'Lunch' }).click()
      await time.fill('19:30')
      await time.blur()
      await expect(dialog.getByRole('radio', { name: 'Lunch' })).toHaveAttribute('aria-checked', 'true')
    })
  })
}
