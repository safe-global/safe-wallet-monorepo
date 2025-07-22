import { faker } from '@faker-js/faker'
import type { EIP1193Provider, OnboardAPI, WalletState } from '@web3-onboard/core'
import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { getConnectedWallet, switchWallet, trackWalletType } from '../useOnboard'
import type { ConnectedWallet } from '../useOnboard'

// mock wallets
jest.mock('@/hooks/wallets/wallets', () => ({
  getDefaultWallets: jest.fn(() => []),
}))

// mock analytics
jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
  WALLET_EVENTS: {
    CONNECT: { event: 'wallet_connect' },
    WALLET_CONNECT: { event: 'wallet_connect_type' },
  },
}))

jest.mock('@/services/analytics/mixpanel', () => ({
  mixpanelTrackWalletConnected: jest.fn(),
}))

jest.mock('@/utils/wallets', () => ({
  isWalletConnect: jest.fn(),
}))

describe('useOnboard', () => {
  describe('getConnectedWallet', () => {
    it('returns the connected wallet', () => {
      const wallets = [
        {
          label: 'Wallet 1',
          icon: 'wallet1.svg',
          provider: null as unknown as EIP1193Provider,
          chains: [{ id: '0x4', namespace: 'evm' }],
          accounts: [
            {
              address: '0x1234567890123456789012345678901234567890',
              ens: {
                name: 'test.eth',
              },
              uns: null,
              balance: {
                ETH: '0.002346456767547',
              },
            },
          ],
        },
        {
          label: 'Wallet 2',
          icon: 'wallet2.svg',
          provider: null as unknown as EIP1193Provider,
          chains: [{ id: '0x100', namespace: 'evm' }],
          accounts: [
            {
              address: '0x2',
              ens: null,
              uns: null,
              balance: null,
            },
          ],
        },
      ] as unknown as WalletState[]

      expect(getConnectedWallet(wallets)).toEqual({
        label: 'Wallet 1',
        icon: 'wallet1.svg',
        address: '0x1234567890123456789012345678901234567890',
        provider: wallets[0].provider,
        chainId: '4',
        ens: 'test.eth',
        balance: '0.00235 ETH',
        isProposer: false,
      })
    })

    it('should return null if the address is invalid', () => {
      const wallets = [
        {
          label: 'Wallet 1',
          icon: 'wallet1.svg',
          provider: null as unknown as EIP1193Provider,
          chains: [{ id: '0x4', namespace: 'evm' }],
          accounts: [
            {
              address: '0xinvalid',
              ens: null,
              uns: null,
              balance: null,
            },
          ],
        },
      ] as unknown as WalletState[]

      expect(getConnectedWallet(wallets)).toBeNull()
    })
  })

  describe('switchWallet', () => {
    it('should not disconnect the wallet if new wallet connects', async () => {
      const mockNewState = [
        {
          accounts: [
            {
              address: faker.finance.ethereumAddress(),
              ens: undefined,
            },
          ],
          chains: [
            {
              id: '5',
            },
          ],
          label: 'MetaMask',
        },
      ]

      const mockOnboard = {
        state: {
          get: jest.fn().mockReturnValue({
            wallets: [
              {
                accounts: [
                  {
                    address: faker.finance.ethereumAddress(),
                    ens: undefined,
                  },
                ],
                chains: [
                  {
                    id: '5',
                  },
                ],
                label: 'Wallet Connect',
              },
            ],
          }),
        },
        connectWallet: jest.fn().mockResolvedValue(mockNewState),
        disconnectWallet: jest.fn(),
      }

      await switchWallet(mockOnboard as unknown as OnboardAPI)

      expect(mockOnboard.connectWallet).toBeCalled()
      expect(mockOnboard.disconnectWallet).not.toHaveBeenCalled()
    })
  })

  describe('trackWalletType', () => {
    let mockTrackEvent: jest.Mock
    let mockMixpanelTrackWalletConnected: jest.Mock
    let mockIsWalletConnect: jest.Mock

    beforeEach(() => {
      mockTrackEvent = jest.requireMock('@/services/analytics').trackEvent
      mockMixpanelTrackWalletConnected = jest.requireMock('@/services/analytics/mixpanel').mixpanelTrackWalletConnected
      mockIsWalletConnect = jest.requireMock('@/utils/wallets').isWalletConnect
      jest.clearAllMocks()
    })

    it('should track GA events and MixPanel event for regular wallet', () => {
      const wallet: ConnectedWallet = {
        label: 'MetaMask',
        address: '0x1234567890123456789012345678901234567890',
        chainId: '1',
        provider: {} as any,
        balance: '1.5 ETH',
        isProposer: false,
      }

      const configs: ChainInfo[] = [
        {
          chainId: '1',
          chainName: 'Ethereum',
          description: 'Ethereum Mainnet',
          shortName: 'eth',
          l2: false,
          rpcUri: { authentication: 'NO_AUTHENTICATION', value: 'https://rpc.url' },
          safeAppsRpcUri: { authentication: 'NO_AUTHENTICATION', value: 'https://rpc.url' },
          publicRpcUri: { authentication: 'NO_AUTHENTICATION', value: 'https://rpc.url' },
          blockExplorerUriTemplate: {
            address: 'https://etherscan.io/address/{{address}}',
            txHash: 'https://etherscan.io/tx/{{txHash}}',
          },
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18, logoUri: 'eth.svg' },
          theme: { textColor: '#001428', backgroundColor: '#E8663D' },
          ensRegistryAddress: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
          gasPrice: [],
          disabledWallets: [],
          features: [],
        },
      ]

      mockIsWalletConnect.mockReturnValue(false)

      trackWalletType(wallet, configs)

      expect(mockTrackEvent).toHaveBeenCalledWith({
        event: 'wallet_connect',
        label: 'MetaMask',
      })

      expect(mockMixpanelTrackWalletConnected).toHaveBeenCalledWith(wallet, 'Ethereum')
    })

    it('should track WalletConnect events when wallet is WalletConnect', () => {
      const wallet: ConnectedWallet = {
        label: 'WalletConnect',
        address: '0x1234567890123456789012345678901234567890',
        chainId: '137',
        provider: {
          connector: {
            session: {
              peer: {
                metadata: {
                  name: 'Trust Wallet',
                },
              },
            },
          },
        } as any,
        balance: '100 MATIC',
        isProposer: false,
      }

      const configs: ChainInfo[] = [
        {
          chainId: '137',
          chainName: 'Polygon',
          description: 'Polygon Mainnet',
          shortName: 'matic',
          l2: false,
          rpcUri: { authentication: 'NO_AUTHENTICATION', value: 'https://rpc.url' },
          safeAppsRpcUri: { authentication: 'NO_AUTHENTICATION', value: 'https://rpc.url' },
          publicRpcUri: { authentication: 'NO_AUTHENTICATION', value: 'https://rpc.url' },
          blockExplorerUriTemplate: {
            address: 'https://polygonscan.com/address/{{address}}',
            txHash: 'https://polygonscan.com/tx/{{txHash}}',
          },
          nativeCurrency: { name: 'Matic', symbol: 'MATIC', decimals: 18, logoUri: 'matic.svg' },
          theme: { textColor: '#ffffff', backgroundColor: '#8248E5' },
          ensRegistryAddress: null,
          gasPrice: [],
          disabledWallets: [],
          features: [],
        },
      ]

      mockIsWalletConnect.mockReturnValue(true)

      trackWalletType(wallet, configs)

      expect(mockTrackEvent).toHaveBeenCalledWith({
        event: 'wallet_connect',
        label: 'WalletConnect',
      })

      expect(mockTrackEvent).toHaveBeenCalledWith({
        event: 'wallet_connect_type',
        label: 'Trust Wallet',
      })

      expect(mockMixpanelTrackWalletConnected).toHaveBeenCalledWith(wallet, 'Polygon')
    })

    it('should use fallback network name when chain config not found', () => {
      const wallet: ConnectedWallet = {
        label: 'MetaMask',
        address: '0x1234567890123456789012345678901234567890',
        chainId: '999',
        provider: {} as any,
        balance: '1.0 ETH',
        isProposer: false,
      }

      const configs: ChainInfo[] = [
        {
          chainId: '1',
          chainName: 'Ethereum',
          description: 'Ethereum Mainnet',
          shortName: 'eth',
          l2: false,
          rpcUri: { authentication: 'NO_AUTHENTICATION', value: 'https://rpc.url' },
          safeAppsRpcUri: { authentication: 'NO_AUTHENTICATION', value: 'https://rpc.url' },
          publicRpcUri: { authentication: 'NO_AUTHENTICATION', value: 'https://rpc.url' },
          blockExplorerUriTemplate: {
            address: 'https://etherscan.io/address/{{address}}',
            txHash: 'https://etherscan.io/tx/{{txHash}}',
          },
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18, logoUri: 'eth.svg' },
          theme: { textColor: '#001428', backgroundColor: '#E8663D' },
          ensRegistryAddress: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
          gasPrice: [],
          disabledWallets: [],
          features: [],
        },
      ]

      mockIsWalletConnect.mockReturnValue(false)

      trackWalletType(wallet, configs)

      expect(mockTrackEvent).toHaveBeenCalledWith({
        event: 'wallet_connect',
        label: 'MetaMask',
      })

      expect(mockMixpanelTrackWalletConnected).toHaveBeenCalledWith(wallet, 'Chain 999')
    })

    it('should handle WalletConnect without peer metadata', () => {
      const wallet: ConnectedWallet = {
        label: 'WalletConnect',
        address: '0x1234567890123456789012345678901234567890',
        chainId: '1',
        provider: {
          connector: {
            session: {
              peer: {
                metadata: {
                  name: null,
                },
              },
            },
          },
        } as any,
        balance: '1.0 ETH',
        isProposer: false,
      }

      const configs: ChainInfo[] = [
        {
          chainId: '1',
          chainName: 'Ethereum',
          description: 'Ethereum Mainnet',
          shortName: 'eth',
          l2: false,
          rpcUri: { authentication: 'NO_AUTHENTICATION', value: 'https://rpc.url' },
          safeAppsRpcUri: { authentication: 'NO_AUTHENTICATION', value: 'https://rpc.url' },
          publicRpcUri: { authentication: 'NO_AUTHENTICATION', value: 'https://rpc.url' },
          blockExplorerUriTemplate: {
            address: 'https://etherscan.io/address/{{address}}',
            txHash: 'https://etherscan.io/tx/{{txHash}}',
          },
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18, logoUri: 'eth.svg' },
          theme: { textColor: '#001428', backgroundColor: '#E8663D' },
          ensRegistryAddress: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
          gasPrice: [],
          disabledWallets: [],
          features: [],
        },
      ]

      mockIsWalletConnect.mockReturnValue(true)

      trackWalletType(wallet, configs)

      expect(mockTrackEvent).toHaveBeenCalledWith({
        event: 'wallet_connect',
        label: 'WalletConnect',
      })

      expect(mockTrackEvent).toHaveBeenCalledWith({
        event: 'wallet_connect_type',
        label: 'Unknown',
      })

      expect(mockMixpanelTrackWalletConnected).toHaveBeenCalledWith(wallet, 'Ethereum')
    })
  })
})
