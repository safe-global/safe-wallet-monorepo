import { act, renderHook } from '@/tests/test-utils'
import useStaggeredLimit from '../useStaggeredLimit'

describe('useStaggeredLimit', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  it('starts with one step', () => {
    const { result } = renderHook(() => useStaggeredLimit(10, 3, 300))

    expect(result.current).toBe(3)
  })

  it('raises the limit by one step after each delay', () => {
    const { result } = renderHook(() => useStaggeredLimit(10, 3, 300))

    act(() => jest.advanceTimersByTime(300))

    expect(result.current).toBe(6)
  })

  it('stops raising once the limit covers the total', () => {
    const { result } = renderHook(() => useStaggeredLimit(5, 3, 300))

    act(() => jest.advanceTimersByTime(3000))

    expect(result.current).toBe(6)
  })
})
