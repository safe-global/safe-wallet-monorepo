import { AppState, AppStateStatus, NativeEventSubscription } from 'react-native'
import { act, renderHook } from '@/src/tests/test-utils'
import { useScreenTracking } from '../useScreenTracking'
import { trackScreenView, trackDatadogView } from '@/src/services/analytics'
import { stopActiveDatadogView, resumeActiveDatadogView } from '@/src/services/analytics/datadogAnalytics'

jest.mock('expo-router', () => ({
  usePathname: jest.fn(() => '/home'),
  useGlobalSearchParams: jest.fn(() => ({})),
}))

jest.mock('@/src/services/analytics', () => ({
  trackScreenView: jest.fn(),
  trackDatadogView: jest.fn(),
}))

jest.mock('@/src/services/analytics/datadogAnalytics', () => ({
  stopActiveDatadogView: jest.fn(),
  resumeActiveDatadogView: jest.fn(),
}))

describe('useScreenTracking', () => {
  let changeHandler: (state: AppStateStatus) => void
  const remove = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, handler) => {
      changeHandler = handler as (state: AppStateStatus) => void
      return { remove } as unknown as NativeEventSubscription
    })
  })

  it('tracks the current screen on mount (Datadog + Firebase)', () => {
    renderHook(() => useScreenTracking())

    expect(trackDatadogView).toHaveBeenCalledWith('/home', '/home')
    expect(trackScreenView).toHaveBeenCalledWith('/home', '/home')
  })

  it('stops the Datadog view on background, without touching Firebase', () => {
    renderHook(() => useScreenTracking())
    expect(trackScreenView).toHaveBeenCalledTimes(1)

    act(() => changeHandler('background'))

    expect(stopActiveDatadogView).toHaveBeenCalledTimes(1)
    expect(resumeActiveDatadogView).not.toHaveBeenCalled()
    // Firebase screen tracking stays navigation-only.
    expect(trackScreenView).toHaveBeenCalledTimes(1)
  })

  it('resumes the Datadog view on active', () => {
    renderHook(() => useScreenTracking())

    act(() => changeHandler('active'))

    expect(resumeActiveDatadogView).toHaveBeenCalledTimes(1)
    expect(stopActiveDatadogView).not.toHaveBeenCalled()
  })

  it('ignores inactive transitions (no stop, no resume)', () => {
    renderHook(() => useScreenTracking())

    act(() => changeHandler('active'))
    act(() => changeHandler('inactive'))
    act(() => changeHandler('active'))

    // Only the two 'active' transitions resume; 'inactive' does nothing.
    expect(stopActiveDatadogView).not.toHaveBeenCalled()
    expect(resumeActiveDatadogView).toHaveBeenCalledTimes(2)
  })

  it('removes the AppState subscription on unmount', () => {
    const { unmount } = renderHook(() => useScreenTracking())

    unmount()

    expect(remove).toHaveBeenCalledTimes(1)
  })
})
