import type { UserProfile } from '~/types/auth'

// Profile returned for any sign-in, since there are no stored accounts yet.
export const DEMO_PROFILE: UserProfile = {
  goal: 'lose', weight: '82.1', target: '76', height: '180', age: '32', activity: 'Moderate',
}
