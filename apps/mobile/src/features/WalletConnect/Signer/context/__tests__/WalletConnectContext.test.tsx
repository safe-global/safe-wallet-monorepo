import React from 'react'
import { renderHook as nativeRenderHook, act } from '@testing-library/react-native'
import { renderHook, createTestStore } from '@/src/tests/test-utils'
import { faker } from '@faker-js/faker'
import { getAddress } from 'ethers'
import { Provider } from 'react-redux'
import {
  useWalletConnectContext,
  useOptionalWalletConnectContext,
  WalletConnectProvider,
} from '../WalletConnectContext'

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

const mockAppKit = { open: mockOpen, disconnect: mockDisconnect }
const mockAccount = { address: mockAddress, chainId: 1, isConnected: true }
const mockWalletInfoResult = { walletInfo: { name: 'MetaMask' } }

const mockAppKitState = { isOpen: false, isLoading: false, isConnected: false, chain: undefined }

jest.mock('@reown/appkit-react-native', () => ({
  AppKit: () => null,
  AppKitProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAppKit: () => mockAppKit,
  useAccount: () => mockAccount,
  useWalletInfo: () => mockWalletInfoResult,
  useProvider: () => ({ provider: undefined }),
  useAppKitState: () => mockAppKitState,
}))

const mockInstance = {} as NonNullable<React.ComponentProps<typeof WalletConnectProvider>['instance']>

/**
 * Renders the hook inside WalletConnectProvider and flushes the bridge
 * effect so the context value is available on `result.current`.
 */
async function renderWithProvider(storeOverrides?: Parameters<typeof createTestStore>[0]) {
  const store = createTestStore(storeOverrides)

  const rendered = nativeRenderHook(() => useOptionalWalletConnectContext(), {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>
        <WalletConnectProvider instance={mockInstance}>{children}</WalletConnectProvider>
      </Provider>
    ),
  })

  // Bridge propagates context via useEffect — flush it
  await act(() => undefined)

  return rendered
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

    it('provides all hook values through context', async () => {
      const { result } = await renderWithProvider()
      const ctx = result.current

      expect(ctx).not.toBeNull()
      expect(ctx?.initiateConnection).toBe(mockInitiateConnection)
      expect(ctx?.reconnect).toBe(mockReconnect)
      expect(ctx?.switchNetwork).toBe(mockSwitchNetwork)
      expect(ctx?.switchNetworkIfNeeded).toBe(mockSwitchNetworkIfNeeded)
      expect(ctx?.sign).toBe(mockSign)
      expect(typeof ctx?.open).toBe('function')
      expect(typeof ctx?.disconnect).toBe('function')
      expect(ctx?.isConnected).toBe(true)
      expect(ctx?.isWrongNetwork).toBe(false)
      expect(ctx?.hasProvider).toBe(true)
      expect(ctx?.address).toBe(mockAddress)
      expect(ctx?.chainId).toBe(1)
      expect(ctx?.walletInfo).toEqual({ name: 'MetaMask' })
    })
  })

  describe('useOptionalWalletConnectContext', () => {
    it('returns null when no instance is provided', () => {
      const store = createTestStore()
      const { result } = nativeRenderHook(() => useOptionalWalletConnectContext(), {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <Provider store={store}>
            <WalletConnectProvider instance={null}>{children}</WalletConnectProvider>
          </Provider>
        ),
      })

      expect(result.current).toBeNull()
    })
  })

  describe('open and disconnect wrappers', () => {
    it('delegates open to useAppKit', async () => {
      const { result } = await renderWithProvider()

      result.current?.open({ view: 'Connect' })

      expect(mockOpen).toHaveBeenCalledWith({ view: 'Connect' })
    })

    it('delegates disconnect to useAppKit', async () => {
      const { result } = await renderWithProvider()

      result.current?.disconnect()

      expect(mockDisconnect).toHaveBeenCalled()
    })
  })

  describe('isWalletConnectSigner', () => {
    it('returns true for walletconnect signers', async () => {
      const wcAddress = getAddress(faker.finance.ethereumAddress())

      const { result } = await renderWithProvider({
        signers: {
          [wcAddress]: { value: wcAddress, name: 'WC Signer', type: 'walletconnect' },
        },
      })

      expect(result.current?.isWalletConnectSigner(wcAddress)).toBe(true)
    })

    it('returns false for non-walletconnect signers', async () => {
      const pkAddress = getAddress(faker.finance.ethereumAddress())

      const { result } = await renderWithProvider({
        signers: {
          [pkAddress]: { value: pkAddress, name: 'PK Signer', type: 'private-key' },
        },
      })

      expect(result.current?.isWalletConnectSigner(pkAddress)).toBe(false)
    })

    it('returns false for unknown addresses', async () => {
      const unknownAddress = getAddress(faker.finance.ethereumAddress())

      const { result } = await renderWithProvider()

      expect(result.current?.isWalletConnectSigner(unknownAddress)).toBe(false)
    })
  })
})
