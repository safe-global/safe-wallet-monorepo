import { act, renderHook } from '@/tests/test-utils'
import { MAX_DISPLAY_MS } from '@/components/common/LaunchScreen/useLaunchScreen'
import { useStepUpSplash } from '../useStepUpSplash'

const mockStartStepUp = jest.fn()

jest.mock('../../utils/stepUp', () => ({
  startStepUp: () => mockStartStepUp(),
}))

const atPhase = (phase: 'idle' | 'leaving' | 'returning') => ({ initialReduxState: { stepUp: { phase } } })

describe('useStepUpSplash', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockStartStepUp.mockReturnValue(true)
  })

  it('should hold no caption while no step-up is in flight', () => {
    const { result } = renderHook(() => useStepUpSplash(), atPhase('idle'))

    expect(result.current).toBeUndefined()
    expect(mockStartStepUp).not.toHaveBeenCalled()
  })

  it('should show the verifying copy and start the redirect on the way out', () => {
    const { result } = renderHook(() => useStepUpSplash(), atPhase('leaving'))

    expect(result.current).toBe('Verifying your identity…')
    expect(mockStartStepUp).toHaveBeenCalledTimes(1)
  })

  it('should show the finishing copy on the way back without redirecting again', () => {
    const { result } = renderHook(() => useStepUpSplash(), atPhase('returning'))

    expect(result.current).toBe('Finishing your request…')
    expect(mockStartStepUp).not.toHaveBeenCalled()
  })

  // Otherwise a redirect that never happens holds the splash open forever.
  it('should release the splash when the redirect is suppressed', () => {
    mockStartStepUp.mockReturnValue(false)

    const { result } = renderHook(() => useStepUpSplash(), atPhase('leaving'))

    expect(result.current).toBeUndefined()
  })

  // Mirrors the launch screen's hard cap: a hanging gateway must not trap anyone.
  it('should release the splash after the safety timeout', () => {
    jest.useFakeTimers()

    const { result } = renderHook(() => useStepUpSplash(), atPhase('returning'))
    expect(result.current).toBe('Finishing your request…')

    act(() => {
      jest.advanceTimersByTime(MAX_DISPLAY_MS)
    })

    expect(result.current).toBeUndefined()
    jest.useRealTimers()
  })
})
