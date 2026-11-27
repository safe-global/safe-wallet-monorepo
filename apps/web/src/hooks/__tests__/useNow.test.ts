import { act, renderHook } from '@/tests/test-utils'
import useNow from '../useNow'

describe('useNow', () => {
  const start = new Date('2026-11-23T12:00:00.000Z').getTime()

  beforeEach(() => jest.setSystemTime(start))

  it('ticks every second', () => {
    const { result } = renderHook(() => useNow())
    expect(result.current).toBe(start)

    act(() => jest.advanceTimersByTime(2_000))

    expect(result.current).toBe(start + 2_000)
  })

  it('shares one interval between its callers and stops it when the last one unmounts', () => {
    const setIntervalSpy = jest.spyOn(global, 'setInterval')
    const first = renderHook(() => useNow())
    const second = renderHook(() => useNow())

    expect(setIntervalSpy).toHaveBeenCalledTimes(1)

    first.unmount()
    expect(jest.getTimerCount()).toBe(1)
    second.unmount()
    expect(jest.getTimerCount()).toBe(0)
  })

  it('runs no interval while disabled', () => {
    renderHook(() => useNow(false))

    expect(jest.getTimerCount()).toBe(0)
  })
})
