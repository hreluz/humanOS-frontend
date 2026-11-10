import { type Page, expect, test } from '@playwright/test'
import { THEMES, expectLeftLog, gotoReady, logPage, openQuickLog, setTheme, shot, signIn } from '../helpers'

test.beforeEach(async ({ context, baseURL }) => {
  await signIn(context, baseURL!)
})

const tabRadio = (page: Page, name: 'Food' | 'Activity' | 'Water') =>
  logPage(page).getByRole('radiogroup', { name: 'What to log' }).getByRole('radio', { name })
const discardDialog = (page: Page) => page.getByRole('alertdialog', { name: 'Discard what you haven\'t logged?' })
const navLink = (page: Page, name: string) => page.getByRole('link', { name, exact: true }).filter({ visible: true })

/** Puts one food in the basket, so leaving asks first. */
async function addBanana(page: Page) {
  await logPage(page).getByLabel('Search foods').fill('banana')
  await logPage(page).getByRole('button', { name: 'Add Banana', exact: true }).click()
  await expect(logPage(page).getByRole('button', { name: 'Log 1 item' })).toBeVisible()
}

for (const theme of THEMES) {
  test.describe(`log page (${theme})`, () => {
    test.beforeEach(async ({ context, baseURL }) => {
      await setTheme(context, theme, baseURL!)
    })

    test('every entry point opens the log page', async ({ page }, testInfo) => {
      await gotoReady(page, '/goals')
      await openQuickLog(page)
      await expect(page).toHaveURL(/\/log$/)
      await expect(tabRadio(page, 'Food')).toHaveAttribute('aria-checked', 'true')
      // The sidebar Log (desktop) or the tab bar + (phones) shows where you are.
      await expect(page.getByRole('link', { name: /^(Log|Log food, activity or water)$/ }).filter({ visible: true })).toHaveAttribute('aria-current', 'page')
      await expect(logPage(page).getByText('Type at least 3 letters to search.')).toBeVisible()
      await shot(page, testInfo, 'log-food', theme)

      await gotoReady(page, '/')
      await page.getByRole('link', { name: /You can still eat/ }).click()
      await expect(page).toHaveURL(/\/log\?tab=food$/)
      await expect(tabRadio(page, 'Food')).toHaveAttribute('aria-checked', 'true')

      await gotoReady(page, '/')
      await page.getByRole('link', { name: '+ Log', exact: true }).click()
      await expect(page).toHaveURL(/\/log$/)

      await gotoReady(page, '/food')
      await page.getByRole('link', { name: '+ Log food' }).click()
      await expect(page).toHaveURL(/\/log\?tab=food$/)
      await expect(tabRadio(page, 'Food')).toHaveAttribute('aria-checked', 'true')
    })

    test('the tab follows the URL', async ({ page }, testInfo) => {
      await gotoReady(page, '/log?tab=water')
      await expect(tabRadio(page, 'Water')).toHaveAttribute('aria-checked', 'true')
      await shot(page, testInfo, 'log-water', theme)

      await gotoReady(page, '/log?tab=nope')
      await expect(tabRadio(page, 'Food')).toHaveAttribute('aria-checked', 'true')

      await gotoReady(page, '/log?tab=activity')
      await page.reload()
      await page.waitForLoadState('networkidle')
      await expect(tabRadio(page, 'Activity')).toHaveAttribute('aria-checked', 'true')
    })

    test('switching tabs changes the URL without adding history', async ({ page }) => {
      await gotoReady(page, '/goals')
      await openQuickLog(page)
      await tabRadio(page, 'Water').click()
      await expect(page).toHaveURL(/\/log\?tab=water$/)
      await tabRadio(page, 'Activity').click()
      await expect(page).toHaveURL(/\/log\?tab=activity$/)
      await page.goBack()
      await expect(page).toHaveURL(/\/goals$/)
    })

    test('X and Escape go back where you came from', async ({ page }) => {
      await gotoReady(page, '/stats')
      await openQuickLog(page)
      await logPage(page).getByRole('button', { name: 'Close' }).click()
      await expect(page).toHaveURL(/\/stats$/)

      await openQuickLog(page)
      await page.keyboard.press('Escape')
      await expect(page).toHaveURL(/\/stats$/)

      // Opened directly, there is nowhere in the app to go back to.
      await gotoReady(page, '/log')
      await logPage(page).getByRole('button', { name: 'Close' }).click()
      await expect(page).toHaveURL(/\/$/)
    })

    test('leaving with a basket item asks first', async ({ page }, testInfo) => {
      await gotoReady(page, '/')
      await openQuickLog(page)
      await addBanana(page)

      // Switching tabs isn't leaving.
      await tabRadio(page, 'Water').click()
      await expect(page).toHaveURL(/\/log\?tab=water$/)
      await expect(discardDialog(page)).toBeHidden()
      await tabRadio(page, 'Food').click()

      const stats = navLink(page, 'Stats')
      await stats.click()
      const dialog = discardDialog(page)
      await expect(dialog).toBeVisible()
      await expect(dialog.getByRole('button', { name: 'Keep editing' })).toBeFocused()
      await expect(page).toHaveURL(/\/log/)
      await shot(page, testInfo, 'log-discard', theme)

      await dialog.getByRole('button', { name: 'Keep editing' }).click()
      await expect(dialog).toBeHidden()
      await expect(stats).toBeFocused()
      await expect(logPage(page).getByRole('button', { name: 'Log 1 item' })).toBeVisible()

      // Escape and the backdrop also keep editing.
      await stats.click()
      await expect(dialog).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(dialog).toBeHidden()
      await expect(page).toHaveURL(/\/log/)
      await logPage(page).getByRole('button', { name: 'Close' }).click()
      await expect(dialog).toBeVisible()
      await page.mouse.click(5, 5)
      await expect(dialog).toBeHidden()
      await expect(logPage(page).getByRole('button', { name: 'Log 1 item' })).toBeVisible()

      await stats.click()
      await dialog.getByRole('button', { name: 'Discard' }).click()
      await expect(page).toHaveURL(/\/stats$/)
    })

    test('browser Back with a basket item asks first', async ({ page }) => {
      await gotoReady(page, '/goals')
      await openQuickLog(page)
      await addBanana(page)
      await page.goBack()
      const dialog = discardDialog(page)
      await expect(dialog).toBeVisible()
      await expect(page).toHaveURL(/\/log/)
      await dialog.getByRole('button', { name: 'Discard' }).click()
      await expect(page).toHaveURL(/\/goals$/)
    })

    test('a picked activity asks, water alone does not', async ({ page }) => {
      await gotoReady(page, '/goals')
      await openQuickLog(page)
      await tabRadio(page, 'Activity').click()
      await logPage(page).getByRole('radio', { name: /Cycling/ }).click()
      await logPage(page).getByRole('button', { name: 'Close' }).click()
      await expect(discardDialog(page)).toBeVisible()
      await discardDialog(page).getByRole('button', { name: 'Discard' }).click()
      await expect(page).toHaveURL(/\/goals$/)

      await openQuickLog(page)
      await tabRadio(page, 'Water').click()
      await logPage(page).getByRole('radio', { name: /750 ml/ }).click()
      await logPage(page).getByRole('button', { name: 'Close' }).click()
      await expect(page).toHaveURL(/\/goals$/)
      await expect(discardDialog(page)).toBeHidden()
    })

    test('logging goes back to Today with no dialog', async ({ page }) => {
      await gotoReady(page, '/')
      const remaining = page.getByTestId('kcal-remaining')
      const before = Number((await remaining.textContent())!.match(/\d+/)![0])
      await openQuickLog(page)
      await addBanana(page)
      await logPage(page).getByRole('button', { name: 'Log 1 item' }).click()
      await expectLeftLog(page)
      await expect(page).toHaveURL(/\/$/)
      await expect(discardDialog(page)).toBeHidden()
      await expect(page.getByRole('region', { name: 'Logged today' }).getByText('Banana').first()).toBeVisible()
      await expect(remaining).not.toHaveText(`You can still eat ${before} kcal`)
      const after = Number((await remaining.textContent())!.match(/\d+/)![0])
      expect(after).toBeLessThan(before)
    })

    test('on phones the pinned bar sits above the tab bar', async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'mobile', 'phone layout only')
      await gotoReady(page, '/food')
      await page.getByRole('link', { name: '+ Log food' }).click()
      await addBanana(page)
      const logBtn = await logPage(page).getByRole('button', { name: 'Log 1 item' }).boundingBox()
      const tabBar = await page.getByRole('navigation').filter({ visible: true }).boundingBox()
      expect(logBtn!.y + logBtn!.height).toBeLessThanOrEqual(tabBar!.y)
      await shot(page, testInfo, 'log-phone', theme)
    })
  })
}
