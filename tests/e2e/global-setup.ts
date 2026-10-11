import { mkdirSync } from 'node:fs'
import { assertServicesUp, registerUser } from './api'
import { createScreenshotDir } from './screenshot-dir'

export default async function globalSetup() {
  // Env set here is inherited by every worker, so the whole run shares one folder and one user.
  const dir = createScreenshotDir()
  mkdirSync(dir, { recursive: true })
  process.env.SCREENSHOT_DIR = dir
  console.log(`Screenshots: ${dir}`)

  await assertServicesUp()
  const user = await registerUser('shared', 'Alex Morgan')
  process.env.E2E_USER_ID = String(user.id)
  process.env.E2E_USER_NAME = user.name
  process.env.E2E_USER_EMAIL = user.email
  process.env.E2E_TOKEN = user.token
}
