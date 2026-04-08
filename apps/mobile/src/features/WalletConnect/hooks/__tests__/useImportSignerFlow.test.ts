import { faker } from '@faker-js/faker'
import { renderHook, act, waitFor } from '@/src/tests/test-utils'
import { useImportSignerFlow } from '../useImportSignerFlow'

const mockAddress = faker.finance.ethereumAddress() as `0x${string}`

const mockRouterPush = jest.fn()
const mockRouterDismiss = jest.fn()
const mockOpen = jest.fn()
const mockDisconnect = jest.fn()
const mockValidateAddressOwnership = jest.fn()
const mockSwitchNetworkIfNeeded = jest.fn().mockResolvedValue(undefined)

jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockRouterPush(...args),
    dismiss: (...args: unknown[]) => mockRouterDismiss(...args),
  },
}))

jest.mock('@/src/hooks/useAddressOwnershipValidation', () => ({
  useAddressOwnershipValidation: () => ({ validateAddressOwnership: mockValidateAddressOwnership }),
}))

jest.mock('../useSwitchNetwork', () => ({
  useSwitchNetwork: () => ({ switchNetworkIfNeeded: mockSwitchNetworkIfNeeded }),
}))

// Mutable state object the hook reads on each render
const mockWalletState = {
  address: undefined as string | undefined,
  isConnected: false,
  walletInfo: undefined as { name: string } | undefined,
}

jest.mock('@reown/appkit-react-native', () => ({
  useAppKit: () => ({ open: mockOpen, disconnect: mockDisconnect }),
  useAccount: () => ({
    isConnected: mockWalletState.isConnected,
    address: mockWalletState.address,
  }),
  useWalletInfo: () => ({ walletInfo: mockWalletState.walletInfo }),
}))

const setConnected = (address: string, walletName = 'MetaMask') => {
  mockWalletState.address = address
  mockWalletState.isConnected = true
  mockWalletState.walletInfo = { name: walletName }
}

const setDisconnected = () => {
  mockWalletState.address = undefined
  mockWalletState.isConnected = false
  mockWalletState.walletInfo = undefined
}

const renderImportFlow = () => renderHook(() => useImportSignerFlow())

describe('useImportSignerFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setDisconnected()
  })

  it('opens the wallet modal when initiateConnection is called', () => {
    const { result } = renderImportFlow()

    act(() => {
      result.current.initiateConnection()
    })

    expect(mockOpen).toHaveBeenCalledWith({ view: 'Connect' })
  })

  it('navigates to name-signer when connected address is an owner', async () => {
    mockValidateAddressOwnership.mockResolvedValue({ isOwner: true })

    const { result, rerender } = renderImportFlow()

    act(() => {
      result.current.initiateConnection()
    })

    setConnected(mockAddress)
    rerender({})

    await waitFor(() => {
      expect(mockValidateAddressOwnership).toHaveBeenCalled()
      expect(mockSwitchNetworkIfNeeded).toHaveBeenCalled()
      expect(mockDisconnect).not.toHaveBeenCalled()
      expect(mockRouterPush).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/import-signers/name-signer',
        }),
      )
    })
  })

  it('disconnects and navigates to error when connected address is not an owner', async () => {
    mockValidateAddressOwnership.mockResolvedValue({ isOwner: false })

    const { result, rerender } = renderImportFlow()

    act(() => {
      result.current.initiateConnection()
    })

    setConnected(mockAddress)
    rerender({})

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

    const { result, rerender } = renderImportFlow()

    act(() => {
      result.current.initiateConnection()
    })

    setConnected(mockAddress)
    rerender({})

    await waitFor(() => {
      expect(mockDisconnect).toHaveBeenCalled()
      expect(mockRouterPush).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/import-signers/connect-signer-error',
        }),
      )
    })
  })

  it('does not navigate when wallet connects without user initiation', () => {
    setConnected(mockAddress)

    renderImportFlow()

    expect(mockValidateAddressOwnership).not.toHaveBeenCalled()
    expect(mockRouterPush).not.toHaveBeenCalled()
  })

  it('does not navigate again for the same address after reconnect', async () => {
    mockValidateAddressOwnership.mockResolvedValue({ isOwner: true })

    const { result, rerender } = renderImportFlow()

    act(() => {
      result.current.initiateConnection()
    })

    setConnected(mockAddress)
    rerender({})

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledTimes(1)
    })

    rerender({})

    expect(mockRouterPush).toHaveBeenCalledTimes(1)
  })

  it('allows navigation after disconnect and reconnect', async () => {
    mockValidateAddressOwnership.mockResolvedValue({ isOwner: true })

    const { result, rerender } = renderImportFlow()

    act(() => {
      result.current.initiateConnection()
    })

    setConnected(mockAddress)
    rerender({})

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledTimes(1)
    })

    // Disconnect
    setDisconnected()
    rerender({})

    // Reconnect
    act(() => {
      result.current.initiateConnection()
    })

    setConnected(mockAddress)
    rerender({})

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledTimes(2)
    })
  })
})
