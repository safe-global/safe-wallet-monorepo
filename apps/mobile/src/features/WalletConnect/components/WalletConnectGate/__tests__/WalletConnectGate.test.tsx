import React from 'react'
import { render, screen, fireEvent } from '@/src/tests/test-utils'
import { Text } from 'tamagui'
import { WalletConnectGate } from '../WalletConnectGate'

const mockReconnect = jest.fn()
const mockSwitchNetworkIfNeeded = jest.fn()
const mockIsWalletConnectSigner = jest.fn()
const mockUseWalletConnectStatus = jest.fn()

jest.mock('@/src/features/WalletConnect/context/WalletConnectContext', () => ({
  useWalletConnectContext: () => ({
    reconnect: mockReconnect,
    switchNetworkIfNeeded: mockSwitchNetworkIfNeeded,
    isWrongNetwork: mockIsWrongNetwork,
    isWalletConnectSigner: mockIsWalletConnectSigner,
  }),
}))

jest.mock('@/src/features/WalletConnect/hooks/useWalletConnectStatus', () => ({
  useWalletConnectStatus: (...args: unknown[]) => mockUseWalletConnectStatus(...args),
}))

let mockIsWrongNetwork = false

const signerAddress = '0x1234567890abcdef1234567890abcdef12345678'

const renderGate = () =>
  render(
    <WalletConnectGate signerAddress={signerAddress}>
      <Text testID="child-content">Child content</Text>
    </WalletConnectGate>,
  )

describe('WalletConnectGate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsWrongNetwork = false
    mockIsWalletConnectSigner.mockReturnValue(false)
    mockUseWalletConnectStatus.mockReturnValue(true)
  })

  it('renders children when signer is not a WalletConnect signer', () => {
    mockIsWalletConnectSigner.mockReturnValue(false)

    renderGate()

    expect(screen.getByTestId('child-content')).toBeTruthy()
    expect(screen.queryByTestId('reconnect-wallet-button')).toBeNull()
    expect(screen.queryByTestId('switch-network-button')).toBeNull()
  })

  it('shows reconnect button when WC signer has no active session', () => {
    mockIsWalletConnectSigner.mockReturnValue(true)
    mockUseWalletConnectStatus.mockReturnValue(false)

    renderGate()

    expect(screen.getByTestId('reconnect-wallet-button')).toBeTruthy()
    expect(screen.getByText('Reconnect wallet to continue')).toBeTruthy()
    expect(screen.queryByTestId('child-content')).toBeNull()
  })

  it('calls reconnect with signer address when reconnect button is pressed', () => {
    mockIsWalletConnectSigner.mockReturnValue(true)
    mockUseWalletConnectStatus.mockReturnValue(false)

    renderGate()

    fireEvent.press(screen.getByTestId('reconnect-wallet-button'))

    expect(mockReconnect).toHaveBeenCalledWith(signerAddress)
  })

  it('shows switch network button when WC signer is on wrong network', () => {
    mockIsWalletConnectSigner.mockReturnValue(true)
    mockUseWalletConnectStatus.mockReturnValue(true)
    mockIsWrongNetwork = true

    renderGate()

    expect(screen.getByTestId('switch-network-button')).toBeTruthy()
    expect(screen.getByText('Switch network to continue')).toBeTruthy()
    expect(screen.queryByTestId('child-content')).toBeNull()
  })

  it('calls switchNetworkIfNeeded when switch network button is pressed', () => {
    mockIsWalletConnectSigner.mockReturnValue(true)
    mockUseWalletConnectStatus.mockReturnValue(true)
    mockIsWrongNetwork = true

    renderGate()

    fireEvent.press(screen.getByTestId('switch-network-button'))

    expect(mockSwitchNetworkIfNeeded).toHaveBeenCalledTimes(1)
  })

  it('renders children when WC signer has active session and correct network', () => {
    mockIsWalletConnectSigner.mockReturnValue(true)
    mockUseWalletConnectStatus.mockReturnValue(true)
    mockIsWrongNetwork = false

    renderGate()

    expect(screen.getByTestId('child-content')).toBeTruthy()
    expect(screen.queryByTestId('reconnect-wallet-button')).toBeNull()
    expect(screen.queryByTestId('switch-network-button')).toBeNull()
  })
})
