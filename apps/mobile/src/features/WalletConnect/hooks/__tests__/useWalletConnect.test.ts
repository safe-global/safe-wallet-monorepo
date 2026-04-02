import { faker } from '@faker-js/faker'
import { getAddress } from 'ethers'
import { renderHook, act, waitFor } from '@/src/tests/test-utils'
import { useWalletConnect } from '@/src/features/WalletConnect/hooks/useWalletConnect'

const mockAddress = faker.finance.ethereumAddress() as `0x${string}`
const mockAddress2 = faker.finance.ethereumAddress() as `0x${string}`

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

  it('passes checksummed address and walletName to name-signer route', async () => {
    mockValidateAddressOwnership.mockResolvedValue({ isOwner: true })

    const { result, rerender } = renderHook(() => useWalletConnect())

    act(() => {
      result.current.initiateConnection()
    })

    mockUseAccount.mockReturnValue({ isConnected: true, address: mockAddress })
    mockUseWalletInfo.mockReturnValue({ walletInfo: { name: 'Rainbow' } })

    rerender({})

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith({
        pathname: '/import-signers/name-signer',
        params: {
          address: getAddress(mockAddress),
          walletName: 'Rainbow',
        },
      })
    })
  })

  it('passes checksummed address and walletIcon to error route', async () => {
    mockValidateAddressOwnership.mockResolvedValue({ isOwner: false })

    const { result, rerender } = renderHook(() => useWalletConnect())

    act(() => {
      result.current.initiateConnection()
    })

    mockUseAccount.mockReturnValue({ isConnected: true, address: mockAddress })
    mockUseWalletInfo.mockReturnValue({
      walletInfo: { name: 'MetaMask', icon: 'https://example.com/icon.png' },
    })

    rerender({})

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith({
        pathname: '/import-signers/connect-signer-error',
        params: {
          address: getAddress(mockAddress),
          walletIcon: 'https://example.com/icon.png',
        },
      })
    })
  })

  it('falls back to empty string when walletInfo.name is undefined', async () => {
    mockValidateAddressOwnership.mockResolvedValue({ isOwner: true })

    const { result, rerender } = renderHook(() => useWalletConnect())

    act(() => {
      result.current.initiateConnection()
    })

    mockUseAccount.mockReturnValue({ isConnected: true, address: mockAddress })
    mockUseWalletInfo.mockReturnValue({ walletInfo: { name: undefined } })

    rerender({})

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({ walletName: '' }),
        }),
      )
    })
  })

  it('falls back to empty string when walletInfo.icon is undefined', async () => {
    mockValidateAddressOwnership.mockResolvedValue({ isOwner: false })

    const { result, rerender } = renderHook(() => useWalletConnect())

    act(() => {
      result.current.initiateConnection()
    })

    mockUseAccount.mockReturnValue({ isConnected: true, address: mockAddress })
    mockUseWalletInfo.mockReturnValue({ walletInfo: { name: 'MetaMask', icon: undefined } })

    rerender({})

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({ walletIcon: '' }),
        }),
      )
    })
  })

  it('validates and navigates when a different address connects', async () => {
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

    // Second connection with a different address (no disconnect in between)
    act(() => {
      result.current.initiateConnection()
    })

    mockUseAccount.mockReturnValue({ isConnected: true, address: mockAddress2 })

    rerender({})

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledTimes(2)
      expect(mockValidateAddressOwnership).toHaveBeenCalledWith(getAddress(mockAddress2))
    })
  })

  it('exposes disconnect, isConnected, and walletInfo from return value', () => {
    mockUseAccount.mockReturnValue({ isConnected: true, address: mockAddress })
    mockUseWalletInfo.mockReturnValue({ walletInfo: { name: 'Trust Wallet' } })

    const { result } = renderHook(() => useWalletConnect())

    expect(result.current.disconnect).toBe(mockDisconnect)
    expect(result.current.isConnected).toBe(true)
    expect(result.current.walletInfo).toEqual({ name: 'Trust Wallet' })
  })

  it('does not validate when walletInfo is null despite being connected', () => {
    const { result, rerender } = renderHook(() => useWalletConnect())

    act(() => {
      result.current.initiateConnection()
    })

    mockUseAccount.mockReturnValue({ isConnected: true, address: mockAddress })
    mockUseWalletInfo.mockReturnValue({ walletInfo: null })

    rerender({})

    expect(mockValidateAddressOwnership).not.toHaveBeenCalled()
    expect(mockRouterPush).not.toHaveBeenCalled()
  })

  it('does not validate when address is null despite being connected', () => {
    const { result, rerender } = renderHook(() => useWalletConnect())

    act(() => {
      result.current.initiateConnection()
    })

    mockUseAccount.mockReturnValue({ isConnected: true, address: null })
    mockUseWalletInfo.mockReturnValue({ walletInfo: { name: 'MetaMask' } })

    rerender({})

    expect(mockValidateAddressOwnership).not.toHaveBeenCalled()
    expect(mockRouterPush).not.toHaveBeenCalled()
  })

  it('does not navigate if unmounted before validation resolves', async () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    let resolveValidation = (_value: { isOwner: boolean }) => {}
    mockValidateAddressOwnership.mockReturnValue(
      new Promise((resolve) => {
        resolveValidation = resolve
      }),
    )

    const { result, rerender, unmount } = renderHook(() => useWalletConnect())

    act(() => {
      result.current.initiateConnection()
    })

    mockUseAccount.mockReturnValue({ isConnected: true, address: mockAddress })
    mockUseWalletInfo.mockReturnValue({ walletInfo: { name: 'MetaMask' } })

    rerender({})

    // Unmount before validation completes
    unmount()

    // Resolve after unmount
    await act(async () => {
      resolveValidation({ isOwner: true })
    })

    expect(mockRouterPush).not.toHaveBeenCalled()
  })
})
