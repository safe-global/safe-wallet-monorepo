import { faker } from '@faker-js/faker'
import { renderHook, act, waitFor } from '@/src/tests/test-utils'
import { useWalletConnect } from '@/src/features/WalletConnect/hooks/useWalletConnect'

const mockAddress = faker.finance.ethereumAddress() as `0x${string}`

const mockRouterPush = jest.fn()
const mockOpen = jest.fn()
const mockDisconnect = jest.fn()
const mockValidateAddressOwnership = jest.fn()
const mockUseAccount = jest.fn()
const mockUseWalletInfo = jest.fn()

jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockRouterPush(...args),
  },
}))

jest.mock('@reown/appkit-react-native', () => ({
  useAppKit: () => ({ open: mockOpen, disconnect: mockDisconnect }),
  useAccount: () => mockUseAccount(),
  useWalletInfo: () => mockUseWalletInfo(),
}))

jest.mock('@/src/hooks/useAddressOwnershipValidation', () => ({
  useAddressOwnershipValidation: () => ({ validateAddressOwnership: mockValidateAddressOwnership }),
}))

describe('useWalletConnect', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAccount.mockReturnValue({ isConnected: false, address: null })
    mockUseWalletInfo.mockReturnValue({ walletInfo: null })
  })

  it('opens the wallet modal when initiateConnection is called', () => {
    const { result } = renderHook(() => useWalletConnect())

    act(() => {
      result.current.initiateConnection()
    })

    expect(mockOpen).toHaveBeenCalledWith({ view: 'Connect' })
  })

  it('navigates to name-signer when connected address is an owner', async () => {
    mockValidateAddressOwnership.mockResolvedValue({ isOwner: true })

    const { result, rerender } = renderHook(() => useWalletConnect())

    act(() => {
      result.current.initiateConnection()
    })

    mockUseAccount.mockReturnValue({ isConnected: true, address: mockAddress })
    mockUseWalletInfo.mockReturnValue({ walletInfo: { name: 'MetaMask' } })

    rerender({})

    await waitFor(() => {
      expect(mockValidateAddressOwnership).toHaveBeenCalled()
      expect(mockDisconnect).not.toHaveBeenCalled()
      expect(mockRouterPush).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/import-signers/name-signer',
        }),
      )
    })
  })

  it('disconnects and navigates to error screen when connected address is not an owner', async () => {
    mockValidateAddressOwnership.mockResolvedValue({ isOwner: false })

    const { result, rerender } = renderHook(() => useWalletConnect())

    act(() => {
      result.current.initiateConnection()
    })

    mockUseAccount.mockReturnValue({ isConnected: true, address: mockAddress })
    mockUseWalletInfo.mockReturnValue({ walletInfo: { name: 'MetaMask' } })

    rerender({})

    await waitFor(() => {
      expect(mockValidateAddressOwnership).toHaveBeenCalled()
      expect(mockDisconnect).toHaveBeenCalled()
      expect(mockRouterPush).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/import-signers/connect-signer-error',
        }),
      )
    })
  })

  it('disconnects and navigates to error screen when validation throws', async () => {
    mockValidateAddressOwnership.mockRejectedValue(new Error('Network error'))

    const { result, rerender } = renderHook(() => useWalletConnect())

    act(() => {
      result.current.initiateConnection()
    })

    mockUseAccount.mockReturnValue({ isConnected: true, address: mockAddress })
    mockUseWalletInfo.mockReturnValue({ walletInfo: { name: 'MetaMask' } })

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
    mockUseAccount.mockReturnValue({ isConnected: true, address: mockAddress })
    mockUseWalletInfo.mockReturnValue({ walletInfo: { name: 'MetaMask' } })

    renderHook(() => useWalletConnect())

    expect(mockValidateAddressOwnership).not.toHaveBeenCalled()
    expect(mockRouterPush).not.toHaveBeenCalled()
  })

  it('does not navigate again for the same address after reconnect', async () => {
    mockValidateAddressOwnership.mockResolvedValue({ isOwner: true })

    const { result, rerender } = renderHook(() => useWalletConnect())

    act(() => {
      result.current.initiateConnection()
    })

    mockUseAccount.mockReturnValue({ isConnected: true, address: mockAddress })
    mockUseWalletInfo.mockReturnValue({ walletInfo: { name: 'MetaMask' } })

    rerender({})

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledTimes(1)
    })

    // Simulate re-render without disconnect — same address should not trigger again
    rerender({})

    expect(mockRouterPush).toHaveBeenCalledTimes(1)
  })

  it('allows navigation after disconnect and reconnect', async () => {
    mockValidateAddressOwnership.mockResolvedValue({ isOwner: true })

    const { result, rerender } = renderHook(() => useWalletConnect())

    // First connection
    act(() => {
      result.current.initiateConnection()
    })

    mockUseAccount.mockReturnValue({ isConnected: true, address: mockAddress })
    mockUseWalletInfo.mockReturnValue({ walletInfo: { name: 'MetaMask' } })

    rerender({})

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledTimes(1)
    })

    // Disconnect
    mockUseAccount.mockReturnValue({ isConnected: false, address: null })
    mockUseWalletInfo.mockReturnValue({ walletInfo: null })

    rerender({})

    // Reconnect with same address
    act(() => {
      result.current.initiateConnection()
    })

    mockUseAccount.mockReturnValue({ isConnected: true, address: mockAddress })
    mockUseWalletInfo.mockReturnValue({ walletInfo: { name: 'MetaMask' } })

    rerender({})

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledTimes(2)
    })
  })
})
