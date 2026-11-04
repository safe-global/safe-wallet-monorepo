import { act, renderHook } from '@testing-library/react'
import { isRateLimited, useRateLimitRetry } from '../useRateLimitRetry'

describe('useRateLimitRetry', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  it('recognises a 429 and nothing else', () => {
    expect(isRateLimited({ status: 429, data: {} })).toBe(true)
    expect(isRateLimited({ status: 500, data: {} })).toBe(false)
    expect(isRateLimited(undefined)).toBe(false)
  })

  it('refetches with growing delays while rate-limited, then gives up after three attempts', () => {
    const refetch = jest.fn()
    const { result, rerender } = renderHook(({ error }) => useRateLimitRetry({ error, refetch }), {
      initialProps: { error: { status: 429 } as unknown },
    })

    expect(result.current).toBe(true)
    act(() => jest.advanceTimersByTime(999))
    expect(refetch).not.toHaveBeenCalled()
    act(() => jest.advanceTimersByTime(1))
    expect(refetch).toHaveBeenCalledTimes(1)

    rerender({ error: { status: 429 } })
    act(() => jest.advanceTimersByTime(2_000))
    expect(refetch).toHaveBeenCalledTimes(2)

    rerender({ error: { status: 429 } })
    act(() => jest.advanceTimersByTime(4_000))
    expect(refetch).toHaveBeenCalledTimes(3)

    rerender({ error: { status: 429 } })
    expect(result.current).toBe(false)
    act(() => jest.advanceTimersByTime(60_000))
    expect(refetch).toHaveBeenCalledTimes(3)
  })

  it('reads the first 429 as retrying in the same render, before its effect runs', () => {
    const refetch = jest.fn()
    const seen: boolean[] = []
    renderHook(() => {
      const isRetrying = useRateLimitRetry({ error: { status: 429 }, refetch })
      seen.push(isRetrying)
      return isRetrying
    })

    expect(seen[0]).toBe(true)
  })

  it('stops and resets once the query recovers or fails for another reason', () => {
    const refetch = jest.fn()
    const { result, rerender } = renderHook(({ error }) => useRateLimitRetry({ error, refetch }), {
      initialProps: { error: { status: 429 } as unknown },
    })
    expect(result.current).toBe(true)

    rerender({ error: undefined })
    expect(result.current).toBe(false)
    act(() => jest.advanceTimersByTime(10_000))
    expect(refetch).not.toHaveBeenCalled()

    rerender({ error: { status: 500 } })
    expect(result.current).toBe(false)
  })
})
