import React from 'react'
import { render } from '@/src/tests/test-utils'
import { WalletConnectBadge } from './WalletConnectBadge'
import { faker } from '@faker-js/faker'

const mockAddress = faker.string.hexadecimal({ length: 40 })
const mockWalletIcon = faker.image.url()

jest.mock('@/src/store/hooks', () => ({
  useAppSelector: jest.fn(),
  useAppDispatch: jest.fn(),
}))

jest.mock('@/src/features/WalletConnect/hooks/useWalletConnectStatus', () => ({
  useWalletConnectStatus: jest.fn(),
}))

const { useAppSelector } = require('@/src/store/hooks')
const { useWalletConnectStatus } = require('@/src/features/WalletConnect/hooks/useWalletConnectStatus')

describe('WalletConnectBadge', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders connected state with success badge when withStatus is true', () => {
    useAppSelector.mockReturnValue({ type: 'walletconnect', walletIcon: mockWalletIcon })
    useWalletConnectStatus.mockReturnValue(true)

    const { getByTestId } = render(<WalletConnectBadge address={mockAddress} testID="wc-badge" withStatus />)

    expect(getByTestId('wc-badge')).toBeTruthy()
  })

  it('renders disconnected state with warning badge when withStatus is true', () => {
    useAppSelector.mockReturnValue({ type: 'walletconnect', walletIcon: mockWalletIcon })
    useWalletConnectStatus.mockReturnValue(false)

    const { getByTestId } = render(<WalletConnectBadge address={mockAddress} testID="wc-badge" withStatus />)

    expect(getByTestId('wc-badge')).toBeTruthy()
  })

  it('renders without status icon when withStatus is false', () => {
    useAppSelector.mockReturnValue({ type: 'walletconnect', walletIcon: mockWalletIcon })
    useWalletConnectStatus.mockReturnValue(true)

    const { getByTestId } = render(<WalletConnectBadge address={mockAddress} testID="wc-badge" />)

    expect(getByTestId('wc-badge')).toBeTruthy()
  })

  it('renders null for non-walletconnect signers', () => {
    useAppSelector.mockReturnValue({ type: 'private-key' })
    useWalletConnectStatus.mockReturnValue(false)

    const { queryByTestId } = render(<WalletConnectBadge address={mockAddress} testID="wc-badge" />)

    expect(queryByTestId('wc-badge')).toBeNull()
  })

  it('renders null when signer has no walletIcon', () => {
    useAppSelector.mockReturnValue({ type: 'walletconnect', walletIcon: undefined })
    useWalletConnectStatus.mockReturnValue(true)

    const { queryByTestId } = render(<WalletConnectBadge address={mockAddress} testID="wc-badge" />)

    expect(queryByTestId('wc-badge')).toBeNull()
  })

  it('renders null when signer is not found', () => {
    useAppSelector.mockReturnValue(undefined)
    useWalletConnectStatus.mockReturnValue(false)

    const { queryByTestId } = render(<WalletConnectBadge address={mockAddress} testID="wc-badge" />)

    expect(queryByTestId('wc-badge')).toBeNull()
  })
})
