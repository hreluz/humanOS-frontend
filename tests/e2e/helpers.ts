import { basename, join, sep } from 'node:path'
import type { BrowserContext, Page, TestInfo } from '@playwright/test'
import { type TestUser, sharedUser } from './api'

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

/** Opens the quick log from the sidebar (desktop) or the tab bar's + button (mobile). */
export async function openQuickLog(page: Page) {
  await page.getByRole('button', { name: /^(Log|Log food, activity or water)$/ }).filter({ visible: true }).click()
}
