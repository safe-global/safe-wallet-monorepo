import { faker } from '@faker-js/faker'
import { getAddress } from 'ethers'
import { renderHook, act, waitFor } from '@/src/tests/test-utils'
import { useImportSignerFlow } from '../useImportSignerFlow'
import type { EventsControllerState } from '@reown/appkit-core-react-native'

const mockAddress = faker.finance.ethereumAddress() as `0x${string}`
const checksumAddress = getAddress(mockAddress)

const mockRouterPush = jest.fn()
const mockOpen = jest.fn()
const mockDisconnect = jest.fn().mockResolvedValue(undefined)
const mockValidateAddressOwnership = jest.fn()
const mockSwitchNetworkIfNeeded = jest.fn().mockResolvedValue(undefined)

jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockRouterPush(...args),
  },
}))

jest.mock('@/src/hooks/useAddressOwnershipValidation', () => ({
  useAddressOwnershipValidation: () => ({ validateAddressOwnership: mockValidateAddressOwnership }),
}))

jest.mock('../useSwitchNetwork', () => ({
  useSwitchNetwork: () => ({ switchNetworkIfNeeded: mockSwitchNetworkIfNeeded }),
}))

// Capture event subscriptions registered by useStableAppKitEvent.
// Must remain the same object reference since jest.mock is hoisted.
const eventSubscriptions: Record<string, ((state: EventsControllerState) => void) | undefined> = {}

jest.mock('@reown/appkit-react-native', () => ({
  useAppKit: () => ({ open: mockOpen, disconnect: mockDisconnect }),
  useAccount: () => ({ isConnected: true, address: mockAddress }),
  useWalletInfo: () => ({ walletInfo: { name: 'MetaMask', icon: 'metamask-icon' } }),
  useAppKitEventSubscription: (event: string, callback: (state: EventsControllerState) => void) => {
    eventSubscriptions[event] = callback
  },
}))

function fireConnectSuccess(address?: string, walletName = 'MetaMask') {
  const state = {
    timestamp: Date.now(),
    data: {
      type: 'track' as const,
      event: 'CONNECT_SUCCESS' as const,
      address,
      properties: { name: walletName },
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

const renderImportFlow = () => renderHook(() => useImportSignerFlow())

describe('useImportSignerFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    Object.keys(eventSubscriptions).forEach((key) => {
      eventSubscriptions[key] = undefined
    })
  })

  it('disconnects and opens the wallet modal when initiateConnection is called', async () => {
    const { result } = renderImportFlow()

    await act(async () => {
      await result.current.initiateConnection()
    })

    expect(mockDisconnect).toHaveBeenCalled()
    expect(mockOpen).toHaveBeenCalledWith({ view: 'Connect' })
  })

  it('navigates to name-signer when connected address is an owner', async () => {
    mockValidateAddressOwnership.mockResolvedValue({ isOwner: true })

    const { result } = renderImportFlow()

    await act(async () => {
      await result.current.initiateConnection()
    })

    mockDisconnect.mockClear()

    act(() => {
      fireConnectSuccess(mockAddress)
    })

    await waitFor(() => {
      expect(mockValidateAddressOwnership).toHaveBeenCalledWith(checksumAddress)
      expect(mockSwitchNetworkIfNeeded).toHaveBeenCalled()
      expect(mockDisconnect).not.toHaveBeenCalled()
      expect(mockRouterPush).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/import-signers/name-signer',
          params: expect.objectContaining({
            address: checksumAddress,
            walletName: 'MetaMask',
          }),
        }),
      )
    })
  })

  it('disconnects and navigates to error when connected address is not an owner', async () => {
    mockValidateAddressOwnership.mockResolvedValue({ isOwner: false })

    const { result } = renderImportFlow()

    await act(async () => {
      await result.current.initiateConnection()
    })

    mockDisconnect.mockClear()

    act(() => {
      fireConnectSuccess(mockAddress)
    })

    await waitFor(() => {
      expect(mockDisconnect).toHaveBeenCalled()
      expect(mockRouterPush).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/import-signers/connect-signer-error',
        }),
      )
    })
  })

  it('disconnects and navigates to error when validation throws', async () => {
    mockValidateAddressOwnership.mockRejectedValue(new Error('Network error'))

    const { result } = renderImportFlow()

    await act(async () => {
      await result.current.initiateConnection()
    })

    mockDisconnect.mockClear()

    act(() => {
      fireConnectSuccess(mockAddress)
    })

    await waitFor(() => {
      expect(mockDisconnect).toHaveBeenCalled()
      expect(mockRouterPush).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/import-signers/connect-signer-error',
        }),
      )
    })
  })

  it('does not navigate when CONNECT_SUCCESS fires without user initiation', () => {
    renderImportFlow()

    act(() => {
      fireConnectSuccess(mockAddress)
    })

    expect(mockValidateAddressOwnership).not.toHaveBeenCalled()
    expect(mockRouterPush).not.toHaveBeenCalled()
  })

  it('does not navigate again for the same CONNECT_SUCCESS event', async () => {
    mockValidateAddressOwnership.mockResolvedValue({ isOwner: true })

    const { result } = renderImportFlow()

    await act(async () => {
      await result.current.initiateConnection()
    })

    act(() => {
      fireConnectSuccess(mockAddress)
    })

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledTimes(1)
    })

    // Fire another CONNECT_SUCCESS without re-initiating — should be ignored
    act(() => {
      fireConnectSuccess(mockAddress)
    })

    expect(mockRouterPush).toHaveBeenCalledTimes(1)
  })

  it('allows navigation after re-initiating connection', async () => {
    mockValidateAddressOwnership.mockResolvedValue({ isOwner: true })

    const { result } = renderImportFlow()

    // First connection
    await act(async () => {
      await result.current.initiateConnection()
    })

    act(() => {
      fireConnectSuccess(mockAddress)
    })

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledTimes(1)
    })

    // Second connection
    await act(async () => {
      await result.current.initiateConnection()
    })

    act(() => {
      fireConnectSuccess(mockAddress)
    })

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledTimes(2)
    })
  })

  it('ignores CONNECT_SUCCESS without address', async () => {
    const { result } = renderImportFlow()

    await act(async () => {
      await result.current.initiateConnection()
    })

    act(() => {
      fireConnectSuccess(undefined)
    })

    expect(mockValidateAddressOwnership).not.toHaveBeenCalled()
    expect(mockRouterPush).not.toHaveBeenCalled()
  })

  it('resets connectInitiatedRef on CONNECT_ERROR', async () => {
    const { result } = renderImportFlow()

    await act(async () => {
      await result.current.initiateConnection()
    })

    act(() => {
      fireConnectError()
    })

    // Now fire a CONNECT_SUCCESS — should be ignored since ref was reset
    act(() => {
      fireConnectSuccess(mockAddress)
    })

    expect(mockValidateAddressOwnership).not.toHaveBeenCalled()
  })

  it('resets connectInitiatedRef on USER_REJECTED', async () => {
    const { result } = renderImportFlow()

    await act(async () => {
      await result.current.initiateConnection()
    })

    act(() => {
      fireUserRejected()
    })

    // Now fire a CONNECT_SUCCESS — should be ignored since ref was reset
    act(() => {
      fireConnectSuccess(mockAddress)
    })

    expect(mockValidateAddressOwnership).not.toHaveBeenCalled()
  })
})
