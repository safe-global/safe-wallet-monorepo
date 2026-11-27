import { act, renderHook } from '@/tests/test-utils'
import { useClock } from '../useClock'

describe('useClock', () => {
  it('should update the timestamp every INTERVAL', () => {
    const timestamp = 69_420
    jest.setSystemTime(timestamp)

    const { result } = renderHook(() => useClock(1_000))

    act(() => jest.advanceTimersByTime(1_000))
    expect(result.current).toBe(timestamp + 1_000)

    act(() => jest.advanceTimersByTime(1_000))
    expect(result.current).toBe(timestamp + 2_000)
  })
})
