import React from 'react'
import { render, screen, fireEvent } from '@/src/tests/test-utils'
import { faker } from '@faker-js/faker'
import { getAddress } from 'ethers'
import { ReconnectError } from '../ReconnectError'

const mockExpectedAddress = getAddress(faker.finance.ethereumAddress())
const mockReconnect = jest.fn()
const mockDismiss = jest.fn()

jest.mock('expo-router', () => ({
  router: {
    dismiss: (...args: unknown[]) => mockDismiss(...args),
  },
  useLocalSearchParams: () => ({ address: mockExpectedAddress }),
}))

jest.mock('@/src/features/WalletConnect/context/WalletConnectContext', () => ({
  useWalletConnectContext: () => ({ reconnect: mockReconnect }),
}))

describe('ReconnectError', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders error message and retry button', () => {
    render(<ReconnectError />)

    expect(screen.getByText('Wrong wallet connected')).toBeTruthy()
    expect(screen.getByTestId('reconnect-error-done')).toBeTruthy()
  })

  it('dismisses and calls reconnect with expected address when retry button is pressed', () => {
    render(<ReconnectError />)

    fireEvent.press(screen.getByTestId('reconnect-error-done'))

    expect(mockDismiss).toHaveBeenCalledTimes(1)
    expect(mockReconnect).toHaveBeenCalledWith(mockExpectedAddress)
  })
})
