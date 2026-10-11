import type { SignupDraft, User, UserProfile } from '~/types/auth'
import { DEMO_PROFILE } from './mocks/auth'
import { delay } from './mocks/delay'

// Mock auth: any credentials succeed. Swap these bodies for $fetch calls once the API exists.

export async function signIn(email: string, _password: string): Promise<User> {
  await delay()
  const raw = email.split('@')[0]!.replace(/[._-]+/g, ' ')
  const name = raw.replace(/\b\w/g, c => c.toUpperCase())
  return { name, email, ...DEMO_PROFILE }
}

export async function signUp(draft: SignupDraft): Promise<SignupDraft> {
  await delay()
  return { ...draft, name: draft.name.trim() }
}

export async function completeOnboarding(draft: SignupDraft, profile: UserProfile): Promise<User> {
  await delay()
  return { name: draft.name, email: draft.email, ...profile }
}

export async function requestPasswordReset(_email: string): Promise<void> {
  await delay()
}

export async function signOut(): Promise<void> {
  await delay()
}
