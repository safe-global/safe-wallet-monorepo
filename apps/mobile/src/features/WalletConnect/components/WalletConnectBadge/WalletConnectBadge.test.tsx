import React from 'react'
import { render, fireEvent } from '@/src/tests/test-utils'
import { WalletConnectBadge } from './WalletConnectBadge'
import { faker } from '@faker-js/faker'
import { Image } from 'expo-image'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'

const mockAddress = faker.string.hexadecimal({ length: 40 })
const mockWalletIcon = faker.image.url()
const otherWalletIcon = faker.image.url()

jest.mock('@/src/store/hooks', () => ({
  useAppSelector: jest.fn(),
  useAppDispatch: jest.fn(),
}))

jest.mock('@/src/features/WalletConnect/hooks/useWalletConnectStatus', () => ({
  useWalletConnectStatus: jest.fn(),
}))

const { useAppSelector } = require('@/src/store/hooks')
const { useWalletConnectStatus } = require('@/src/features/WalletConnect/hooks/useWalletConnectStatus')

function renderBadge(props: Partial<React.ComponentProps<typeof WalletConnectBadge>> = {}) {
  return render(<WalletConnectBadge address={mockAddress} testID="wc-badge" {...props} />)
}

function getBadgeBg(props: Partial<React.ComponentProps<typeof WalletConnectBadge>> = {}) {
  const result = renderBadge(props)
  const bg = result.getByTestId('wc-badge').props.style.backgroundColor
  result.unmount()
  return bg
}

describe('WalletConnectBadge', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('null rendering', () => {
    it('renders null when no wallet icon is available', () => {
      useAppSelector.mockReturnValue(undefined)
      useWalletConnectStatus.mockReturnValue(false)

      const { queryByTestId } = renderBadge()

      expect(queryByTestId('wc-badge')).toBeNull()
    })

    it('renders null when WC signer has no walletIcon', () => {
      useAppSelector.mockReturnValue({ type: 'walletconnect', walletIcon: undefined })
      useWalletConnectStatus.mockReturnValue(true)

      const { queryByTestId } = renderBadge()

      expect(queryByTestId('wc-badge')).toBeNull()
    })

    it('renders null after image fails to load', () => {
      useAppSelector.mockReturnValue({ type: 'walletconnect', walletIcon: mockWalletIcon })
      useWalletConnectStatus.mockReturnValue(true)

      const { UNSAFE_getByType, queryByTestId } = renderBadge({ status: 'connected' })

      expect(queryByTestId('wc-badge')).toBeTruthy()

      fireEvent(UNSAFE_getByType(Image), 'error')

      expect(queryByTestId('wc-badge')).toBeNull()
    })
  })

  describe('wallet icon resolution', () => {
    it('prefers walletIcon prop over signer walletIcon', () => {
      useAppSelector.mockReturnValue({ type: 'walletconnect', walletIcon: mockWalletIcon })
      useWalletConnectStatus.mockReturnValue(true)

      const { UNSAFE_getByType } = renderBadge({ walletIcon: otherWalletIcon })
      const imageSource = UNSAFE_getByType(Image).props.source

      expect(imageSource).toBe(otherWalletIcon)
    })

    it('falls back to signer wallet icon prop when no walletIcon prop is provided', () => {
      useAppSelector.mockReturnValue(undefined)
      useWalletConnectStatus.mockReturnValue(false)

      const { UNSAFE_getByType } = renderBadge({ walletIcon: mockWalletIcon, status: 'error' })
      const imageSource = UNSAFE_getByType(Image).props.source

      expect(imageSource).toBe(mockWalletIcon)
    })
  })

  describe('status resolution', () => {
    it('auto-derives different background for connected vs disconnected', () => {
      useAppSelector.mockReturnValue({ type: 'walletconnect', walletIcon: mockWalletIcon })

      useWalletConnectStatus.mockReturnValue(true)
      const connectedBg = getBadgeBg()

      useWalletConnectStatus.mockReturnValue(false)
      const disconnectedBg = getBadgeBg()

      expect(connectedBg).not.toBe(disconnectedBg)
    })

    it('auto-derives error status for non-WC signer with walletIcon prop', () => {
      useAppSelector.mockReturnValue({ type: 'private-key' })
      useWalletConnectStatus.mockReturnValue(false)
      const nonWcBg = getBadgeBg({ walletIcon: mockWalletIcon })

      useAppSelector.mockReturnValue({ type: 'walletconnect', walletIcon: mockWalletIcon })
      const explicitErrorBg = getBadgeBg({ status: 'error' })

      expect(nonWcBg).toBe(explicitErrorBg)
    })

    it('status prop overrides auto-derived status', () => {
      useAppSelector.mockReturnValue({ type: 'walletconnect', walletIcon: mockWalletIcon })
      useWalletConnectStatus.mockReturnValue(true)

      const autoConnectedBg = getBadgeBg()
      const explicitErrorBg = getBadgeBg({ status: 'error' })

      expect(explicitErrorBg).not.toBe(autoConnectedBg)
    })
  })

  describe('skipStatus', () => {
    it('omits status overlay badge', () => {
      useAppSelector.mockReturnValue({ type: 'walletconnect', walletIcon: mockWalletIcon })
      useWalletConnectStatus.mockReturnValue(true)

      const withStatus = renderBadge({ status: 'connected' })
      expect(withStatus.UNSAFE_queryAllByType(SafeFontIcon)).toHaveLength(1)
      withStatus.unmount()

      const withSkip = renderBadge({ skipStatus: true })
      expect(withSkip.UNSAFE_queryAllByType(SafeFontIcon)).toHaveLength(0)
    })
  })
})
