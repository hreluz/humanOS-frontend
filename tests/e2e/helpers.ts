import { basename, join, sep } from 'node:path'
import { type BrowserContext, type Locator, type Page, type TestInfo, expect } from '@playwright/test'
import { METRIC_PROFILE, type TestUser, registerUser, saveProfile, sharedUser } from './api'

export type Theme = 'light' | 'dark'
export const THEMES: Theme[] = ['light', 'dark']

function cookie(name: string, value: string, baseURL: string) {
  return { name, value, url: baseURL }
}

export async function setTheme(context: BrowserContext, theme: Theme, baseURL: string) {
  await context.addCookies([cookie('humanos_theme', theme, baseURL)])
}

/**
 * Signs in by setting the token + goal cookies the app reads (same encoding as Nuxt's useCookie).
 * The profile comes from the API. Defaults to the user registered in global setup.
 */
export async function signIn(context: BrowserContext, baseURL: string, user: TestUser = sharedUser()) {
  await context.addCookies([cookie('humanos_token', encodeURIComponent(user.token), baseURL)])
  await setGoal(context, baseURL, user)
}

/**
 * Registers a user with a profile and signs this browser in as them. For tests that write to the API (e.g. create
 * ingredients), so the shared user doesn't collect data across runs.
 */
export async function signInAsNewUser(context: BrowserContext, baseURL: string, tag: string): Promise<TestUser> {
  const user = await registerUser(tag, 'Alex Morgan')
  await saveProfile(user, METRIC_PROFILE)
  await signIn(context, baseURL, user)
  return user
}

/** Types a search on the Quick log page and waits for the results to load. */
export async function searchLog(page: Page, query: string) {
  await logPage(page).getByLabel('Search foods').fill(query)
  await expect(logPage(page).getByText('Searching…')).toBeHidden()
}

/** Picks the goal for `user` on this browser (the backend has none), so a user with an API profile lands on home. */
export async function setGoal(context: BrowserContext, baseURL: string, user: TestUser = sharedUser(), goal = 'lose') {
  await context.addCookies([cookie('humanos_goal', encodeURIComponent(JSON.stringify({ userId: user.id, goal })), baseURL)])
}

export async function gotoReady(page: Page, path: string) {
  await page.goto(path)
  await page.waitForLoadState('networkidle')
}

/**
 * Saves a screenshot into the run folder: specs in `tests/e2e/features/<name>.spec.ts` go to `feature/<name>/`
 * (the feature being built, to review), everything else to `e2e/` (the full regression set).
 */
export async function shot(page: Page, testInfo: TestInfo, screen: string, theme: Theme) {
  const dir = process.env.SCREENSHOT_DIR
  if (!dir) throw new Error('SCREENSHOT_DIR not set — global setup did not run')
  const feature = testInfo.file.split(sep).includes('features') ? basename(testInfo.file, '.spec.ts') : null
  const group = feature ? join('feature', feature) : 'e2e'
  await page.screenshot({ path: join(dir, group, `${testInfo.project.name}-${screen}-${theme}.png`), fullPage: true })
}

/** Waits until every image inside `scope` has loaded (Commons photos load lazily, after a redirect), so shots show them. */
export async function waitForImages(scope: Locator) {
  const imgs = scope.locator('img')
  for (let i = 0; i < await imgs.count(); i++) {
    await imgs.nth(i).scrollIntoViewIfNeeded()
    await expect.poll(() => imgs.nth(i).evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0), { timeout: 15_000 }).toBe(true)
  }
}

/** Opens the quick log page from the sidebar's Log link (desktop) or the tab bar's + link (mobile). */
export async function openQuickLog(page: Page) {
  await page.getByRole('link', { name: /^(Log|Log food, activity or water)$/ }).filter({ visible: true }).click()
  await expect(page).toHaveURL(/\/log(\?|$)/)
}

/** The quick log page's content. */
export function logPage(page: Page) {
  return page.getByRole('main')
}

/** Waits until the quick log page has been left, e.g. after a successful log. */
export async function expectLeftLog(page: Page) {
  await expect(page).not.toHaveURL(/\/log(\?|$)/)
}

/** Adds catalog ingredients on the new recipe page by searching each name and picking its exact match. */
export async function addIngredients(page: Page, ...names: string[]) {
  for (const name of names) {
    await page.getByLabel('Add an ingredient').fill(name)
    await page.getByRole('button', { name: new RegExp(`^${name}`) }).first().click()
  }
}
