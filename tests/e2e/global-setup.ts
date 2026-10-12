import { mkdirSync } from 'node:fs'
import { METRIC_PROFILE, assertServicesUp, exportUser, registerUser, saveProfile } from './api'
import { createScreenshotDir } from './screenshot-dir'

export default async function globalSetup() {
  // Env set here is inherited by every worker, so the whole run shares one folder and the same users.
  const dir = createScreenshotDir()
  mkdirSync(dir, { recursive: true })
  process.env.SCREENSHOT_DIR = dir
  console.log(`Screenshots: ${dir}`)

  await assertServicesUp()
  const user = await registerUser('shared', 'Alex Morgan')
  await saveProfile(user, METRIC_PROFILE)
  exportUser('E2E_USER', user)
  exportUser('E2E_NEW_USER', await registerUser('new', 'Alex Morgan'))
}
