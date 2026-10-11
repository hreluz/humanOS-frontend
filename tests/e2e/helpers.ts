import { join } from 'node:path'
import type { BrowserContext, Page, TestInfo } from '@playwright/test'

export type Theme = 'light' | 'dark'
export const THEMES: Theme[] = ['light', 'dark']

export const DEMO_USER = {
  name: 'Alex Morgan', email: 'alex@example.com', goal: 'lose', weight: '82.1', target: '76', height: '180', age: '32', activity: 'Moderate',
}

function cookie(name: string, value: string, baseURL: string) {
  return { name, value, url: baseURL }
}

export async function setTheme(context: BrowserContext, theme: Theme, baseURL: string) {
  await context.addCookies([cookie('humanos_theme', theme, baseURL)])
}

/** Signs in by setting the session cookie the app reads (same encoding as Nuxt's useCookie). */
export async function signIn(context: BrowserContext, baseURL: string) {
  await context.addCookies([cookie('humanos_user', encodeURIComponent(JSON.stringify(DEMO_USER)), baseURL)])
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
