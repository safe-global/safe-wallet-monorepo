import { useIntervalCounter } from '@safe-global/utils/hooks/useIntervalCounter'
import { act, renderHook } from '@testing-library/react'

describe('useIntervalCounter', () => {
  beforeAll(() => {
    jest.useFakeTimers()
  })

  it('should increment the value over time', async () => {
    const { result } = renderHook(() => useIntervalCounter(100))

    expect(result.current[0]).toBe(0)
    expect(result.current[1]).toBeInstanceOf(Function)

    act(() => {
      jest.advanceTimersByTime(200)
    })

    expect(result.current[0]).toBe(1)

    act(() => {
      jest.advanceTimersByTime(200)
    })

    expect(result.current[0]).toBe(2)
  })

  it('should reset the counter', async () => {
    const { result } = renderHook(() => useIntervalCounter(100))

    act(() => {
      jest.advanceTimersByTime(200)
    })

    expect(result.current[0]).toBe(1)

    act(() => {
      result.current[1]()
    })

    expect(result.current[0]).toBe(0)
  })
})
