import { act, renderHook } from '@testing-library/react'
import { POLICIES_CLOCK_TICK_MS, usePoliciesClock } from '../usePoliciesClock'

describe('usePoliciesClock', () => {
  beforeEach(() => {
    jest.useFakeTimers({ advanceTimers: false })
  })

  it('should, when it mounts, read the current time', () => {
    const { result } = renderHook(() => usePoliciesClock())

    expect(result.current).toBe(Date.now())
  })

  it('should, when a tick has passed, read the time of that tick', () => {
    const { result } = renderHook(() => usePoliciesClock())
    const mountedAt = Date.now()

    act(() => jest.advanceTimersByTime(POLICIES_CLOCK_TICK_MS))

    expect(result.current).toBe(mountedAt + POLICIES_CLOCK_TICK_MS)
  })

  it('should, between two ticks, give every reader the same time', () => {
    const first = renderHook(() => usePoliciesClock())
    act(() => jest.advanceTimersByTime(POLICIES_CLOCK_TICK_MS / 2))

    const second = renderHook(() => usePoliciesClock())

    expect(second.result.current).toBe(first.result.current)
  })

  it('should, when a reader joins after the time moved between ticks, move every reader to the current time', () => {
    const first = renderHook(() => usePoliciesClock())
    jest.setSystemTime(Date.now() + 2 * POLICIES_CLOCK_TICK_MS)

    const second = renderHook(() => usePoliciesClock())

    expect(second.result.current).toBe(Date.now())
    expect(first.result.current).toBe(Date.now())
  })
})
