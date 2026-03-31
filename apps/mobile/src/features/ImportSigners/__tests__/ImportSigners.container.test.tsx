import React from 'react'
import { faker } from '@faker-js/faker'
import { render, screen, fireEvent, waitFor } from '@/src/tests/test-utils'
import { ImportSignersContainer } from '../ImportSigners.container'

const mockAddress = faker.finance.ethereumAddress() as `0x${string}`

const mockRouterPush = jest.fn()
const mockOpen = jest.fn()
const mockValidateAddressOwnership = jest.fn()
const mockUseAccount = jest.fn()
const mockUseWalletInfo = jest.fn()

jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockRouterPush(...args),
    navigate: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    dismissAll: jest.fn(),
  },
}))

jest.mock('@/src/hooks/useBiometrics', () => ({
  useBiometrics: () => ({ isBiometricsEnabled: true }),
}))

jest.mock('@reown/appkit-react-native', () => ({
  useAppKit: () => ({ open: mockOpen }),
  useAccount: () => mockUseAccount(),
  useWalletInfo: () => mockUseWalletInfo(),
}))

jest.mock('@/src/hooks/useAddressOwnershipValidation', () => ({
  useAddressOwnershipValidation: () => ({ validateAddressOwnership: mockValidateAddressOwnership }),
}))

jest.mock('@/src/navigation/useScrollableHeader', () => ({
  useScrollableHeader: () => ({ handleScroll: jest.fn() }),
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0 }),
}))

describe('ImportSignersContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAccount.mockReturnValue({ isConnected: false, address: null })
    mockUseWalletInfo.mockReturnValue({ walletInfo: null })
  })

  it('renders all three signer import options', () => {
    render(<ImportSignersContainer />)

    expect(screen.getByText('Import using private key')).toBeTruthy()
    expect(screen.getByText('Connect hardware device')).toBeTruthy()
    expect(screen.getByText('Connect wallet app')).toBeTruthy()
  })

  it('opens wallet modal when connect wallet app is pressed', () => {
    render(<ImportSignersContainer />)

    fireEvent.press(screen.getByTestId('connectSigner'))

    expect(mockOpen).toHaveBeenCalledWith({ view: 'Connect' })
  })

  it('navigates to private key screen when seed is pressed', () => {
    render(<ImportSignersContainer />)

    fireEvent.press(screen.getByTestId('seed'))

    expect(mockRouterPush).toHaveBeenCalledWith('/import-signers/signer')
  })

  it('navigates to hardware devices when hardware signer is pressed', () => {
    render(<ImportSignersContainer />)

    fireEvent.press(screen.getByTestId('hardwareSigner'))

    expect(mockRouterPush).toHaveBeenCalledWith('/import-signers/hardware-devices')
  })

  it('navigates to name-signer when connected address is an owner', async () => {
    mockValidateAddressOwnership.mockResolvedValue({ isOwner: true })

    const { rerender } = render(<ImportSignersContainer />)

    fireEvent.press(screen.getByTestId('connectSigner'))

    mockUseAccount.mockReturnValue({ isConnected: true, address: mockAddress })
    mockUseWalletInfo.mockReturnValue({ walletInfo: { name: 'MetaMask', icon: '' } })

    rerender(<ImportSignersContainer />)

    await waitFor(() => {
      expect(mockValidateAddressOwnership).toHaveBeenCalled()
      expect(mockRouterPush).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/import-signers/name-signer',
        }),
      )
    })
  })

  it('navigates to error screen when connected address is not an owner', async () => {
    mockValidateAddressOwnership.mockResolvedValue({ isOwner: false })

    const { rerender } = render(<ImportSignersContainer />)

    fireEvent.press(screen.getByTestId('connectSigner'))

    mockUseAccount.mockReturnValue({ isConnected: true, address: mockAddress })
    mockUseWalletInfo.mockReturnValue({ walletInfo: { name: 'MetaMask', icon: '' } })

    rerender(<ImportSignersContainer />)

    await waitFor(() => {
      expect(mockValidateAddressOwnership).toHaveBeenCalled()
      expect(mockRouterPush).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/import-signers/connect-signer-error',
        }),
      )
    })
  })

  it('navigates to error screen when validation throws', async () => {
    mockValidateAddressOwnership.mockRejectedValue(new Error('Network error'))

    const { rerender } = render(<ImportSignersContainer />)

    fireEvent.press(screen.getByTestId('connectSigner'))

    mockUseAccount.mockReturnValue({ isConnected: true, address: mockAddress })
    mockUseWalletInfo.mockReturnValue({ walletInfo: { name: 'MetaMask', icon: '' } })

    rerender(<ImportSignersContainer />)

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/import-signers/connect-signer-error',
        }),
      )
    })
  })

  it('does not navigate when wallet connects without user initiation', () => {
    mockUseAccount.mockReturnValue({ isConnected: true, address: mockAddress })
    mockUseWalletInfo.mockReturnValue({ walletInfo: { name: 'MetaMask', icon: '' } })

    render(<ImportSignersContainer />)

    expect(mockValidateAddressOwnership).not.toHaveBeenCalled()
    expect(mockRouterPush).not.toHaveBeenCalled()
  })
})
