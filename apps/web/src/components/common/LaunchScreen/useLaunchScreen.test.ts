import { renderHook, act } from '@testing-library/react'
import { useGetChainsConfigV2Query } from '@safe-global/store/gateway'
import { useLaunchScreen, MIN_DISPLAY_MS, MAX_DISPLAY_MS } from './useLaunchScreen'

jest.mock('@safe-global/store/gateway', () => ({
  useGetChainsConfigV2Query: jest.fn(),
}))

const mockChainsQuery = useGetChainsConfigV2Query as unknown as jest.Mock

const setChainsState = (state: { isSuccess?: boolean; isError?: boolean }) =>
  mockChainsQuery.mockReturnValue({ isSuccess: false, isError: false, ...state })

describe('useLaunchScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    setChainsState({}) // still loading
  })

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers()
    })
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  it('is visible on first mount', () => {
    const { result } = renderHook(() => useLaunchScreen())
    expect(result.current.visible).toBe(true)
  })

  it('stays visible while the chains config is still loading, even past the min display', () => {
    const { result } = renderHook(() => useLaunchScreen())
    act(() => {
      jest.advanceTimersByTime(MIN_DISPLAY_MS + 100)
    })
    expect(result.current.visible).toBe(true)
  })

  it('stays visible when ready but the minimum display has not elapsed', () => {
    setChainsState({ isSuccess: true })
    const { result } = renderHook(() => useLaunchScreen())
    act(() => {
      jest.advanceTimersByTime(MIN_DISPLAY_MS - 100)
    })
    expect(result.current.visible).toBe(true)
  })

  it('hides once the chains config has settled AND the minimum display elapsed', () => {
    setChainsState({ isSuccess: true })
    const { result } = renderHook(() => useLaunchScreen())
    act(() => {
      jest.advanceTimersByTime(MIN_DISPLAY_MS)
    })
    expect(result.current.visible).toBe(false)
  })

  it('hides on a chains config error too', () => {
    setChainsState({ isError: true })
    const { result } = renderHook(() => useLaunchScreen())
    act(() => {
      jest.advanceTimersByTime(MIN_DISPLAY_MS)
    })
    expect(result.current.visible).toBe(false)
  })

  it('hides via the safety timeout even if the chains config never settles', () => {
    const { result } = renderHook(() => useLaunchScreen())
    act(() => {
      jest.advanceTimersByTime(MAX_DISPLAY_MS)
    })
    expect(result.current.visible).toBe(false)
  })

  it('never returns to visible after hiding', () => {
    setChainsState({ isSuccess: true })
    const { result, rerender } = renderHook(() => useLaunchScreen())
    act(() => {
      jest.advanceTimersByTime(MIN_DISPLAY_MS)
    })
    expect(result.current.visible).toBe(false)

    // The query flipping back to loading (e.g. a refetch) must not re-show the splash.
    setChainsState({})
    rerender()
    act(() => {
      jest.advanceTimersByTime(1000)
    })
    expect(result.current.visible).toBe(false)
  })
})
