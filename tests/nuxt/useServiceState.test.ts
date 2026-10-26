import { beforeEach, describe, expect, it, vi } from 'vitest'

/** A promise the test settles by hand, to look at the state while a request is in flight. */
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

// `useAsyncData` keeps the first handler registered under a key, so each test gets its own key.
let n = 0
let KEY = ''
beforeEach(() => {
  KEY = `service-state-test-${++n}`
})

describe('useServiceState.retry', () => {
  it('fills state after a failed load, and is pending while it runs', async () => {
    const loader = vi.fn<() => Promise<string[]>>().mockRejectedValueOnce(new Error('500'))
    const { state, pending, error, retry, retrying } = useServiceState(KEY, loader)
    await vi.waitUntil(() => error.value)
    expect(pending.value).toBe(false)

    const request = deferred<string[]>()
    loader.mockReturnValue(request.promise)
    const done = retry()
    expect(pending.value).toBe(true)
    expect(retrying.value).toBe(true)

    request.resolve(['a'])
    await done
    expect(state.value).toEqual(['a'])
    expect(pending.value).toBe(false)
    expect(retrying.value).toBe(false)
  })

  it('leaves state null and keeps the error when the retry fails, without throwing', async () => {
    const loader = vi.fn<() => Promise<string[]>>().mockRejectedValue(new Error('500'))
    const { state, pending, error, retry } = useServiceState(KEY, loader)
    await vi.waitUntil(() => error.value)

    await expect(retry()).resolves.toBeUndefined()
    expect(state.value).toBeNull()
    expect(error.value).toBeTruthy()
    expect(pending.value).toBe(false)
  })
})
