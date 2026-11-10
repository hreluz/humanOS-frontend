import { expect, test } from '@playwright/test'
import { getIngredient, sharedUser } from '../api'
import { THEMES, gotoReady, logPage, openQuickLog, setTheme, shot, signIn, waitForImages } from '../helpers'

const EGG = 'Egg, whole, hard-boiled'

test.beforeEach(async ({ context, baseURL }) => {
  await signIn(context, baseURL!)
})

for (const theme of THEMES) {
  test.describe(`food photos (${theme})`, () => {
    test.beforeEach(async ({ context, baseURL }) => {
      await setTheme(context, theme, baseURL!)
    })

    test('the egg thumbnail opens a credited viewer over /log', async ({ page }, testInfo) => {
      // Credits come from the API, not hard-coded, so a reseeded catalog doesn't break the test.
      const { photos } = await getIngredient(sharedUser(), 'egg_whole_hard_boiled')
      const first = photos[0]!
      expect(photos.length).toBeGreaterThan(1)

      await gotoReady(page, '/')
      await openQuickLog(page)
      await logPage(page).getByLabel('Search foods').fill('egg')
      await logPage(page).getByRole('button', { name: `Add ${EGG}`, exact: true }).click()
      await expect(logPage(page).getByRole('button', { name: 'Log 1 item' })).toBeVisible()

      await logPage(page).getByRole('button', { name: `Photos of ${EGG}` }).click()
      const viewer = page.getByRole('dialog', { name: `${EGG} photos` })
      await expect(viewer).toBeVisible()
      await expect(viewer.getByRole('heading', { name: EGG })).toBeVisible()

      const credit = viewer.getByTestId('photo-credit')
      await expect(credit).toHaveText(`Photo: ${[first.author, first.license, 'Source'].filter(Boolean).join(' · ')}`, { useInnerText: true })
      if (first.license_url) await expect(credit.getByRole('link', { name: first.license! })).toHaveAttribute('href', first.license_url)
      await expect(credit.getByRole('link', { name: 'Source' })).toHaveAttribute('href', first.credit_url!)
      await waitForImages(viewer)
      await shot(page, testInfo, 'food-photos', theme)

      // Arrows step through the photos, and the credit follows.
      await viewer.getByRole('button', { name: 'Next photo' }).click()
      await expect(viewer.getByRole('button', { name: /^Photo 2:/ })).toHaveAttribute('aria-current', 'true')
      if (photos[1]!.author) await expect(credit).toContainText(photos[1]!.author)
      await viewer.getByRole('button', { name: 'Previous photo' }).click()
      await expect(viewer.getByRole('button', { name: /^Photo 1:/ })).toHaveAttribute('aria-current', 'true')

      // Escape closes the viewer only: still on /log, basket unchanged.
      await page.keyboard.press('Escape')
      await expect(viewer).toBeHidden()
      await expect(page).toHaveURL(/\/log/)
      await expect(logPage(page).getByLabel(`${EGG} amount`)).toHaveValue('1')
      await expect(logPage(page).getByRole('button', { name: 'Log 1 item' })).toBeVisible()
    })
  })
}
