import { faker } from '@faker-js/faker'
import { getAddress } from 'ethers'
import { renderHook, act } from '@/src/tests/test-utils'
import { useReconnectFlow } from '../useReconnectFlow'
import type { EventsControllerState } from '@reown/appkit-core-react-native'

const mockAddress = faker.finance.ethereumAddress() as `0x${string}`
const mockOtherAddress = faker.finance.ethereumAddress() as `0x${string}`

const mockRouterPush = jest.fn()
const mockOpen = jest.fn()
const mockDisconnect = jest.fn().mockResolvedValue(undefined)
const mockSwitchNetworkIfNeeded = jest.fn().mockResolvedValue(undefined)

jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockRouterPush(...args),
  },
}))

jest.mock('../useSwitchNetwork', () => ({
  useSwitchNetwork: () => ({
    switchNetworkIfNeeded: mockSwitchNetworkIfNeeded,
    switchNetwork: jest.fn(),
  }),
}))

// Capture event subscriptions registered by useStableAppKitEvent.
// Must remain the same object reference since jest.mock is hoisted.
const eventSubscriptions: Record<string, ((state: EventsControllerState) => void) | undefined> = {}

jest.mock('@reown/appkit-react-native', () => ({
  useAppKit: () => ({ open: mockOpen, disconnect: mockDisconnect }),
  useAppKitEventSubscription: (event: string, callback: (state: EventsControllerState) => void) => {
    eventSubscriptions[event] = callback
  },
}))

function fireConnectSuccess(address?: string) {
  const state = {
    timestamp: Date.now(),
    data: {
      type: 'track' as const,
      event: 'CONNECT_SUCCESS' as const,
      address,
      properties: { name: 'MetaMask' },
    },
    pendingWalletImpressions: [],
  }

  eventSubscriptions['CONNECT_SUCCESS']?.(state as EventsControllerState)
}

function fireConnectError() {
  const state = {
    timestamp: Date.now(),
    data: {
      type: 'track' as const,
      event: 'CONNECT_ERROR' as const,
      properties: { message: 'Connection failed' },
    },
    pendingWalletImpressions: [],
  }

  eventSubscriptions['CONNECT_ERROR']?.(state as EventsControllerState)
}

function fireUserRejected() {
  const state = {
    timestamp: Date.now(),
    data: {
      type: 'track' as const,
      event: 'USER_REJECTED' as const,
      properties: { message: 'User rejected' },
    },
    pendingWalletImpressions: [],
  }

  eventSubscriptions['USER_REJECTED']?.(state as EventsControllerState)
}

const renderReconnectFlow = () => renderHook(() => useReconnectFlow())

describe('useReconnectFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    Object.keys(eventSubscriptions).forEach((key) => {
      eventSubscriptions[key] = undefined
    })
  })

  it('disconnects and opens the wallet modal when reconnect is called', async () => {
    const { result } = renderReconnectFlow()

    await act(async () => {
      await result.current.reconnect(mockAddress)
    })

    expect(mockDisconnect).toHaveBeenCalled()
    expect(mockOpen).toHaveBeenCalledWith({ view: 'Connect' })
  })

  it('switches network when reconnected address matches', async () => {
    const { result } = renderReconnectFlow()

    await act(async () => {
      await result.current.reconnect(mockAddress)
    })

    mockDisconnect.mockClear()

    act(() => {
      fireConnectSuccess(mockAddress)
    })

    expect(mockSwitchNetworkIfNeeded).toHaveBeenCalled()
    expect(mockDisconnect).not.toHaveBeenCalled()
    expect(mockRouterPush).not.toHaveBeenCalled()
  })

  it('disconnects and navigates to error when address does not match', async () => {
    const { result } = renderReconnectFlow()

    await act(async () => {
      await result.current.reconnect(mockAddress)
    })

    mockDisconnect.mockClear()

    act(() => {
      fireConnectSuccess(mockOtherAddress)
    })

    expect(mockDisconnect).toHaveBeenCalled()
    expect(mockRouterPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/import-signers/reconnect-error',
        params: { address: getAddress(mockAddress) },
      }),
    )
  })

  it('disconnects and navigates to error when CONNECT_SUCCESS has no address', async () => {
    const { result } = renderReconnectFlow()

    await act(async () => {
      await result.current.reconnect(mockAddress)
    })

    mockDisconnect.mockClear()

    act(() => {
      fireConnectSuccess(undefined)
    })

    expect(mockDisconnect).toHaveBeenCalled()
    expect(mockRouterPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/import-signers/reconnect-error',
      }),
    )
  })

  it('does not act when CONNECT_SUCCESS fires without reconnect initiation', () => {
    renderReconnectFlow()

    act(() => {
      fireConnectSuccess(mockAddress)
    })

    expect(mockSwitchNetworkIfNeeded).not.toHaveBeenCalled()
    expect(mockRouterPush).not.toHaveBeenCalled()
  })

  it('resets pendingAddressRef on CONNECT_ERROR', async () => {
    const { result } = renderReconnectFlow()

    await act(async () => {
      await result.current.reconnect(mockAddress)
    })

    act(() => {
      fireConnectError()
    })

    // Now fire a CONNECT_SUCCESS — should be ignored since ref was reset
    act(() => {
      fireConnectSuccess(mockAddress)
    })

    expect(mockSwitchNetworkIfNeeded).not.toHaveBeenCalled()
  })

  it('resets pendingAddressRef on USER_REJECTED', async () => {
    const { result } = renderReconnectFlow()

    await act(async () => {
      await result.current.reconnect(mockAddress)
    })

    act(() => {
      fireUserRejected()
    })

    // Now fire a CONNECT_SUCCESS — should be ignored since ref was reset
    act(() => {
      fireConnectSuccess(mockAddress)
    })

    expect(mockSwitchNetworkIfNeeded).not.toHaveBeenCalled()
  })
})
