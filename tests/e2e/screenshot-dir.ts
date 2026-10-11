import { execSync } from 'node:child_process'
import { join } from 'node:path'

/** `.playwright-screenshots/<branch>_<timestamp>/` — computed once per run in global setup. */
export function createScreenshotDir() {
  let branch = 'detached'
  try {
    branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim()
  }
  catch {
    // Not a git checkout: keep the default.
  }
  // Local time, e.g. 2026-10-10T14-03-22
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const timestamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`
  return join(process.cwd(), '.playwright-screenshots', `${branch.replace(/\//g, '-')}_${timestamp}`)
}
