/** Simulated network latency so loading states are exercised against mocks. */
export const MOCK_LATENCY_MS = 150

export function delay(ms = MOCK_LATENCY_MS) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}
