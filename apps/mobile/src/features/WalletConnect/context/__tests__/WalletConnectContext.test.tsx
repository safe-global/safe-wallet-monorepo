import React from 'react'
import { renderHook as nativeRenderHook } from '@testing-library/react-native'
import { renderHook, createTestStore } from '@/src/tests/test-utils'
import { faker } from '@faker-js/faker'
import { getAddress } from 'ethers'
import { Provider } from 'react-redux'
import { useWalletConnectContext, WalletConnectProvider } from '../WalletConnectContext'

const mockAddress = getAddress(faker.finance.ethereumAddress())

const mockInitiateConnection = jest.fn()
const mockReconnect = jest.fn()
const mockSwitchNetwork = jest.fn()
const mockSwitchNetworkIfNeeded = jest.fn()
const mockSign = jest.fn()
const mockOpen = jest.fn()
const mockDisconnect = jest.fn()

jest.mock('../../hooks/useImportSignerFlow', () => ({
  useImportSignerFlow: () => ({
    initiateConnection: mockInitiateConnection,
    isConnected: true,
  }),
}))

jest.mock('../../hooks/useReconnectFlow', () => ({
  useReconnectFlow: () => ({
    reconnect: mockReconnect,
  }),
}))

jest.mock('../../hooks/useSwitchNetwork', () => ({
  useSwitchNetwork: () => ({
    switchNetwork: mockSwitchNetwork,
    switchNetworkIfNeeded: mockSwitchNetworkIfNeeded,
    isWrongNetwork: false,
  }),
}))

jest.mock('../../hooks/useWalletConnectSigning', () => ({
  useWalletConnectSigning: () => ({
    sign: mockSign,
    hasProvider: true,
  }),
}))

jest.mock('@reown/appkit-react-native', () => ({
  AppKitProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  AppKit: () => null,
  useAppKit: () => ({ open: mockOpen, disconnect: mockDisconnect }),
  useAccount: () => ({ address: mockAddress, chainId: 1 }),
  useWalletInfo: () => ({ walletInfo: { name: 'MetaMask' } }),
}))

jest.mock('@/src/config/appKit', () => ({
  appKit: {},
}))

const renderWithProvider = (storeOverrides?: Parameters<typeof createTestStore>[0]) => {
  const store = createTestStore(storeOverrides)

  return nativeRenderHook(() => useWalletConnectContext(), {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>
        <WalletConnectProvider>{children}</WalletConnectProvider>
      </Provider>
    ),
  })
}

describe('WalletConnectContext', () => {
  describe('useWalletConnectContext', () => {
    it('throws when used outside WalletConnectProvider', () => {
      jest.spyOn(console, 'error').mockImplementation(jest.fn())

      expect(() => {
        renderHook(() => useWalletConnectContext())
      }).toThrow('useWalletConnectContext must be used within a WalletConnectProvider')

      jest.restoreAllMocks()
    })

    it('provides all hook values through context', () => {
      const { result } = renderWithProvider()

      expect(result.current.initiateConnection).toBe(mockInitiateConnection)
      expect(result.current.reconnect).toBe(mockReconnect)
      expect(result.current.switchNetwork).toBe(mockSwitchNetwork)
      expect(result.current.switchNetworkIfNeeded).toBe(mockSwitchNetworkIfNeeded)
      expect(result.current.sign).toBe(mockSign)
      expect(typeof result.current.open).toBe('function')
      expect(typeof result.current.disconnect).toBe('function')
      expect(result.current.isConnected).toBe(true)
      expect(result.current.isWrongNetwork).toBe(false)
      expect(result.current.hasProvider).toBe(true)
      expect(result.current.address).toBe(mockAddress)
      expect(result.current.chainId).toBe(1)
      expect(result.current.walletInfo).toEqual({ name: 'MetaMask' })
    })
  })

  describe('open and disconnect wrappers', () => {
    it('delegates open to useAppKit', () => {
      const { result } = renderWithProvider()

      result.current.open()

      expect(mockOpen).toHaveBeenCalled()
    })

    it('delegates disconnect to useAppKit', () => {
      const { result } = renderWithProvider()

      result.current.disconnect()

      expect(mockDisconnect).toHaveBeenCalled()
    })
  })

  describe('isWalletConnectSigner', () => {
    it('returns true for walletconnect signers', () => {
      const wcAddress = getAddress(faker.finance.ethereumAddress())

      const { result } = renderWithProvider({
        signers: {
          [wcAddress]: { value: wcAddress, name: 'WC Signer', type: 'walletconnect' },
        },
      })

      expect(result.current.isWalletConnectSigner(wcAddress)).toBe(true)
    })

    it('returns false for non-walletconnect signers', () => {
      const pkAddress = getAddress(faker.finance.ethereumAddress())

      const { result } = renderWithProvider({
        signers: {
          [pkAddress]: { value: pkAddress, name: 'PK Signer', type: 'private-key' },
        },
      })

      expect(result.current.isWalletConnectSigner(pkAddress)).toBe(false)
    })

    it('returns false for unknown addresses', () => {
      const unknownAddress = getAddress(faker.finance.ethereumAddress())

      const { result } = renderWithProvider()

      expect(result.current.isWalletConnectSigner(unknownAddress)).toBe(false)
    })
  })
})
