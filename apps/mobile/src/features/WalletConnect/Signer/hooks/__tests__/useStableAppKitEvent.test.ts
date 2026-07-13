import { renderHook } from '@testing-library/react-native'
import { useStableAppKitEvent } from '../useStableAppKitEvent'

const subscriptions: Record<string, ((state: unknown) => void) | undefined> = {}

jest.mock('@reown/appkit-react-native', () => ({
  useAppKitEventSubscription: (event: string, callback: (state: unknown) => void) => {
    subscriptions[event] = callback
  },
}))

function makeState(event: string) {
  return { timestamp: Date.now(), data: { type: 'track', event }, pendingWalletImpressions: [] }
}

describe('useStableAppKitEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    Object.keys(subscriptions).forEach((key) => {
      subscriptions[key] = undefined
    })
  })

  it('subscribes to the specified event', () => {
    const callback = jest.fn()

    renderHook(() => useStableAppKitEvent('CONNECT_SUCCESS', callback))

    expect(subscriptions['CONNECT_SUCCESS']).toBeDefined()
  })

  it('forwards event state to the callback when event name matches', () => {
    const callback = jest.fn()

    renderHook(() => useStableAppKitEvent('CONNECT_SUCCESS', callback))

    const mockState = makeState('CONNECT_SUCCESS')
    subscriptions['CONNECT_SUCCESS']?.(mockState)

    expect(callback).toHaveBeenCalledWith(mockState)
  })

  it('filters out events whose data.event does not match the subscribed event', () => {
    const callback = jest.fn()

    renderHook(() => useStableAppKitEvent('CONNECT_SUCCESS', callback))

    subscriptions['CONNECT_SUCCESS']?.(makeState('DISCONNECT_SUCCESS'))

    expect(callback).not.toHaveBeenCalled()
  })

  it('uses the latest callback without re-subscribing', () => {
    const firstCallback = jest.fn()
    const secondCallback = jest.fn()

    const { rerender } = renderHook(({ cb }) => useStableAppKitEvent('CONNECT_SUCCESS', cb), {
      initialProps: { cb: firstCallback },
    })

    const initialSubscription = subscriptions['CONNECT_SUCCESS']

    rerender({ cb: secondCallback })

    // Subscription reference should be stable (same function)
    expect(subscriptions['CONNECT_SUCCESS']).toBe(initialSubscription)

    // But calling it should invoke the latest callback
    const mockState = makeState('CONNECT_SUCCESS')
    subscriptions['CONNECT_SUCCESS']?.(mockState)

    expect(firstCallback).not.toHaveBeenCalled()
    expect(secondCallback).toHaveBeenCalledWith(mockState)
  })
})
