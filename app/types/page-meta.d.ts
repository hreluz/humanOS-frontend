import type { TabKey } from './ui'

declare module '#app' {
  interface PageMeta {
    /** Highlighted nav tab; also picks the top bar title. */
    tab?: TabKey
  }
}

export {}
