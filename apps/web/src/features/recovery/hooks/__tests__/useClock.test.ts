import { renderHook, waitFor } from '@/tests/test-utils'
import { useClock } from '../useClock'

describe('useClock', () => {
  it('should update the timestamp every INTERVAL', async () => {
    jest.useFakeTimers()

    const timestamp = 69_420
    jest.setSystemTime(timestamp)

    const { result } = renderHook(() => useClock(1_000))

    jest.advanceTimersByTime(1_000)

    await waitFor(() => {
      expect(result.current).toBe(timestamp + 1_000)
    })

    jest.advanceTimersByTime(1_000)

    await waitFor(() => {
      expect(result.current).toBe(timestamp + 2_000)
    })

    jest.useRealTimers()
  })
})
