import { renderHook } from '@testing-library/react-native'
import { useWcToastBridge, showWcToast } from '../useWcToastBridge'

const mockShow = jest.fn()
jest.mock('@tamagui/toast', () => ({ useToastController: () => ({ show: mockShow }) }))

beforeEach(() => jest.clearAllMocks())

describe('useWcToastBridge', () => {
  it('is a no-op before the bridge is mounted', () => {
    showWcToast('hello')
    expect(mockShow).not.toHaveBeenCalled()
  })

  it('forwards showWcToast to the toast controller while mounted', () => {
    const { unmount } = renderHook(() => useWcToastBridge())

    showWcToast('hello', { native: false, duration: 2500 })
    expect(mockShow).toHaveBeenCalledWith('hello', { native: false, duration: 2500 })

    // After unmount it deregisters and goes quiet again.
    unmount()
    mockShow.mockClear()
    showWcToast('later')
    expect(mockShow).not.toHaveBeenCalled()
  })

  // Double-mount (HMR / strict-mode / overlapping test renders): the second mount wins, and
  // the first's cleanup must not clear the still-live bridge.
  it('keeps the bridge live when an older mount tears down after a newer one took over', () => {
    const first = renderHook(() => useWcToastBridge())
    const second = renderHook(() => useWcToastBridge())

    // The older mount unmounts last; its cleanup sees a currentShow it no longer owns.
    first.unmount()

    showWcToast('still works')
    expect(mockShow).toHaveBeenCalledWith('still works', undefined)

    second.unmount()
    mockShow.mockClear()
    showWcToast('now quiet')
    expect(mockShow).not.toHaveBeenCalled()
  })
})
