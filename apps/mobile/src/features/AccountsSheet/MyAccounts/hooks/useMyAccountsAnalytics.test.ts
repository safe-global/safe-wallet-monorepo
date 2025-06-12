import { renderHook, act } from '@/src/tests/test-utils'
import { useMyAccountsAnalytics } from './useMyAccountsAnalytics'
import * as firebaseAnalytics from '@/src/services/analytics/firebaseAnalytics'
import * as overviewEvents from '@/src/services/analytics/events/overview'

const mockTotalSafeCount = 3
const initialStore = {
  safes: { '0x1': {}, '0x2': {}, '0x3': {} },
  myAccounts: { isEdit: false },
}

describe('useMyAccountsAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('tracks screen view event', async () => {
    const trackEventSpy = jest.spyOn(firebaseAnalytics, 'trackEvent').mockResolvedValue(undefined)
    const eventSpy = jest.spyOn(overviewEvents, 'createMyAccountsScreenViewEvent')
    const { result } = renderHook(() => useMyAccountsAnalytics(), initialStore)

    await act(async () => {
      await result.current.trackScreenView()
    })

    expect(eventSpy).toHaveBeenCalledWith(mockTotalSafeCount)
    expect(trackEventSpy).toHaveBeenCalledWith(expect.objectContaining({ eventAction: 'My accounts screen viewed' }))
  })

  it('tracks edit mode change event (enter)', async () => {
    const trackEventSpy = jest.spyOn(firebaseAnalytics, 'trackEvent').mockResolvedValue(undefined)
    const eventSpy = jest.spyOn(overviewEvents, 'createMyAccountsEditModeEvent')
    const { result } = renderHook(() => useMyAccountsAnalytics(), initialStore)

    await act(async () => {
      await result.current.trackEditModeChange(true)
    })

    expect(eventSpy).toHaveBeenCalledWith(true, mockTotalSafeCount)
    expect(trackEventSpy).toHaveBeenCalledWith(expect.objectContaining({ eventAction: 'Edit mode entered' }))
  })

  it('tracks edit mode change event (exit)', async () => {
    const trackEventSpy = jest.spyOn(firebaseAnalytics, 'trackEvent').mockResolvedValue(undefined)
    const eventSpy = jest.spyOn(overviewEvents, 'createMyAccountsEditModeEvent')
    const { result } = renderHook(() => useMyAccountsAnalytics(), initialStore)

    await act(async () => {
      await result.current.trackEditModeChange(false)
    })

    expect(eventSpy).toHaveBeenCalledWith(false, mockTotalSafeCount)
    expect(trackEventSpy).toHaveBeenCalledWith(expect.objectContaining({ eventAction: 'Edit mode exited' }))
  })

  it('tracks reorder event', async () => {
    const trackEventSpy = jest.spyOn(firebaseAnalytics, 'trackEvent').mockResolvedValue(undefined)
    const eventSpy = jest.spyOn(overviewEvents, 'createSafeReorderEvent')
    const { result } = renderHook(() => useMyAccountsAnalytics(), initialStore)

    await act(async () => {
      await result.current.trackReorder()
    })

    expect(eventSpy).toHaveBeenCalledWith(mockTotalSafeCount)
    expect(trackEventSpy).toHaveBeenCalledWith(expect.objectContaining({ eventAction: 'Safe reordered' }))
  })

  it('logs error if trackEvent throws', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {
      // do nothing
    })
    jest.spyOn(firebaseAnalytics, 'trackEvent').mockRejectedValue(new Error('fail'))
    const { result } = renderHook(() => useMyAccountsAnalytics(), initialStore)

    await act(async () => {
      await result.current.trackScreenView()
      await result.current.trackEditModeChange(true)
      await result.current.trackReorder()
    })

    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })
})
