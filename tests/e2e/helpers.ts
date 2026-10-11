import { join } from 'node:path'
import type { BrowserContext, Page, TestInfo } from '@playwright/test'
import { type TestUser, sharedUser } from './api'

export type Theme = 'light' | 'dark'
export const THEMES: Theme[] = ['light', 'dark']

export const DEMO_PROFILE = {
  goal: 'lose', weight: '82.1', target: '76', height: '180', age: '32', activity: 'Moderate',
}

/** Monday (local YYYY-MM-DD) of the week `weeksAgo` weeks before this one; mirrors app/utils/weeks.ts. */
function weekStart(weeksAgo: number) {
  const d = new Date()
  d.setDate(d.getDate() - 7 * weeksAgo - ((d.getDay() + 6) % 7))
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Five weeks of history ending last week, so this week is still open to log. */
export const DEMO_WEIGH_INS = [83.4, 83.0, 82.9, 82.5, 82.1].map((weight, i, all) => ({
  week: weekStart(all.length - i), weight, activity: 'Moderate',
}))

function cookie(name: string, value: string, baseURL: string) {
  return { name, value, url: baseURL }
}

export async function setTheme(context: BrowserContext, theme: Theme, baseURL: string) {
  await context.addCookies([cookie('humanos_theme', theme, baseURL)])
}

/**
 * Signs in by setting the token + onboarding profile cookies the app reads (same encoding as Nuxt's useCookie).
 * Defaults to the user registered in global setup.
 */
export async function signIn(context: BrowserContext, baseURL: string, user: TestUser = sharedUser()) {
  await context.addCookies([cookie('humanos_token', encodeURIComponent(user.token), baseURL)])
  await setProfile(context, baseURL, user)
}

/** Marks onboarding as done for `user` on this browser, so signing in lands on home. */
export async function setProfile(context: BrowserContext, baseURL: string, user: TestUser = sharedUser()) {
  await context.addCookies([
    cookie('humanos_profile', encodeURIComponent(JSON.stringify({ userId: user.id, profile: DEMO_PROFILE })), baseURL),
    cookie('humanos_weighins', encodeURIComponent(JSON.stringify({ userId: user.id, entries: DEMO_WEIGH_INS })), baseURL),
  ])
}

export async function gotoReady(page: Page, path: string) {
  await page.goto(path)
  await page.waitForLoadState('networkidle')
}

export async function shot(page: Page, testInfo: TestInfo, screen: string, theme: Theme) {
  const dir = process.env.SCREENSHOT_DIR
  if (!dir) throw new Error('SCREENSHOT_DIR not set — global setup did not run')
  await page.screenshot({ path: join(dir, `${testInfo.project.name}-${screen}-${theme}.png`), fullPage: true })
}
