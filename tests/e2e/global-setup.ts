import { mkdirSync } from 'node:fs'
import { createScreenshotDir } from './screenshot-dir'

export default function globalSetup() {
  // Env set here is inherited by every worker, so the whole run shares one folder.
  const dir = createScreenshotDir()
  mkdirSync(dir, { recursive: true })
  process.env.SCREENSHOT_DIR = dir
  console.log(`Screenshots: ${dir}`)
}
