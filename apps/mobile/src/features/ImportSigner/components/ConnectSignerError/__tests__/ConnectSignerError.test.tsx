import React from 'react'
import { render, screen, fireEvent } from '@/src/tests/test-utils'
import { ConnectSignerError } from '../ConnectSignerError'

const mockInitiateConnection = jest.fn()
const mockDismiss = jest.fn()

jest.mock('expo-router', () => ({
  router: {
    dismiss: (...args: unknown[]) => mockDismiss(...args),
  },
  useLocalSearchParams: () => ({
    address: '0xabc123',
    walletIcon: 'https://example.com/icon.png',
  }),
}))

jest.mock('@/src/features/WalletConnect/context/WalletConnectContext', () => ({
  useWalletConnectContext: () => ({ initiateConnection: mockInitiateConnection }),
}))

jest.mock('@/src/features/WalletConnect/components/WalletConnectBadge', () => ({
  WalletConnectBadge: () => null,
}))

describe('ConnectSignerError', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders error message and done button', () => {
    render(<ConnectSignerError />)

    expect(screen.getByText("Can't sign with this wallet")).toBeTruthy()
    expect(screen.getByText("This wallet isn't a signer on this Safe.")).toBeTruthy()
    expect(screen.getByText('Connect a different wallet.')).toBeTruthy()
    expect(screen.getByTestId('connect-signer-error-done')).toBeTruthy()
  })

  it('dismisses and calls initiateConnection when button is pressed', () => {
    render(<ConnectSignerError />)

    fireEvent.press(screen.getByTestId('connect-signer-error-done'))

    expect(mockDismiss).toHaveBeenCalledTimes(1)
    expect(mockInitiateConnection).toHaveBeenCalledTimes(1)
  })
})
