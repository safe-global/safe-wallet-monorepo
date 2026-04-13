import { renderHook } from '@testing-library/react-native'
import { useOnAppKitConnect } from '../useOnAppKitConnect'

const subscriptions: Record<string, ((state: unknown) => void) | undefined> = {}

jest.mock('@reown/appkit-react-native', () => ({
  useAppKitEventSubscription: (event: string, callback: (state: unknown) => void) => {
    subscriptions[event] = callback
  },
}))

function fireEvent(event: string, data: Record<string, unknown> = {}) {
  subscriptions[event]?.({
    timestamp: Date.now(),
    data: { type: 'track', event, ...data },
    pendingWalletImpressions: [],
  })
}

describe('useOnAppKitConnect', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    Object.keys(subscriptions).forEach((key) => {
      subscriptions[key] = undefined
    })
  })

  it('subscribes to CONNECT_SUCCESS, CONNECT_ERROR, and USER_REJECTED', () => {
    renderHook(() => useOnAppKitConnect(jest.fn(), jest.fn()))

    expect(subscriptions['CONNECT_SUCCESS']).toBeDefined()
    expect(subscriptions['CONNECT_ERROR']).toBeDefined()
    expect(subscriptions['USER_REJECTED']).toBeDefined()
  })

  it('calls onSuccess with narrowed event data on CONNECT_SUCCESS', () => {
    const onSuccess = jest.fn()

    renderHook(() => useOnAppKitConnect(onSuccess, jest.fn()))

    fireEvent('CONNECT_SUCCESS', {
      address: '0x1234',
      properties: { name: 'MetaMask' },
    })

    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'CONNECT_SUCCESS',
        address: '0x1234',
        properties: { name: 'MetaMask' },
      }),
    )
  })

  it('calls onFailure on CONNECT_ERROR', () => {
    const onFailure = jest.fn()

    renderHook(() => useOnAppKitConnect(jest.fn(), onFailure))

    fireEvent('CONNECT_ERROR', { properties: { message: 'failed' } })

    expect(onFailure).toHaveBeenCalled()
  })

  it('calls onFailure on USER_REJECTED', () => {
    const onFailure = jest.fn()

    renderHook(() => useOnAppKitConnect(jest.fn(), onFailure))

    fireEvent('USER_REJECTED', { properties: { message: 'rejected' } })

    expect(onFailure).toHaveBeenCalled()
  })
})
