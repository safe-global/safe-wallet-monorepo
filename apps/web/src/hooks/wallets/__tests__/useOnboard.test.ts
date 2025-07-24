import { faker } from '@faker-js/faker'
import type { EIP1193Provider, OnboardAPI, WalletState } from '@web3-onboard/core'
import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { RPC_AUTHENTICATION } from '@safe-global/safe-gateway-typescript-sdk'
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
  MixPanelEventParams: {
    EOA_WALLET_LABEL: 'EOA Wallet Label',
    EOA_WALLET_ADDRESS: 'EOA Wallet Address',
    EOA_WALLET_NETWORK: 'EOA Wallet Network',
  },
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
    let mockIsWalletConnect: jest.Mock

    beforeEach(() => {
      mockTrackEvent = jest.requireMock('@/services/analytics').trackEvent
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
          transactionService: 'https://safe-transaction.mainnet.gnosis.io',
          chainId: '1',
          chainName: 'Ethereum',
          chainLogoUri: '',
          description: 'Ethereum Mainnet',
          shortName: 'eth',
          l2: false,
          isTestnet: false,
          rpcUri: { authentication: RPC_AUTHENTICATION.NO_AUTHENTICATION, value: 'https://rpc.url' },
          safeAppsRpcUri: { authentication: RPC_AUTHENTICATION.NO_AUTHENTICATION, value: 'https://rpc.url' },
          publicRpcUri: { authentication: RPC_AUTHENTICATION.NO_AUTHENTICATION, value: 'https://rpc.url' },
          blockExplorerUriTemplate: {
            address: 'https://etherscan.io/address/{{address}}',
            txHash: 'https://etherscan.io/tx/{{txHash}}',
            api: 'https://api.etherscan.io/api?module={{module}}&action={{action}}&address={{address}}&apiKey={{apiKey}}',
          },
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18, logoUri: 'eth.svg' },
          theme: { textColor: '#001428', backgroundColor: '#E8663D' },
          ensRegistryAddress: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
          contractAddresses: {
            createCallAddress: null,
            fallbackHandlerAddress: null,
            multiSendAddress: null,
            multiSendCallOnlyAddress: null,
            safeProxyFactoryAddress: null,
            safeSingletonAddress: null,
            safeWebAuthnSignerFactoryAddress: null,
            signMessageLibAddress: null,
            simulateTxAccessorAddress: null,
          },
          gasPrice: [],
          disabledWallets: [],
          features: [],
          balancesProvider: {
            chainName: null,
            enabled: false,
          },
          recommendedMasterCopyVersion: '1.4.1',
        },
      ]

      mockIsWalletConnect.mockReturnValue(false)

      trackWalletType(wallet, configs)

      expect(mockTrackEvent).toHaveBeenCalledWith(
        {
          event: 'wallet_connect',
          label: 'MetaMask',
        },
        {
          'EOA Wallet Label': 'MetaMask',
          'EOA Wallet Address': '0x1234567890123456789012345678901234567890',
          'EOA Wallet Network': 'Ethereum',
        },
      )
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
          transactionService: 'https://safe-transaction.polygon.gnosis.io',
          chainId: '137',
          chainName: 'Polygon',
          chainLogoUri: '',
          description: 'Polygon Mainnet',
          shortName: 'matic',
          l2: false,
          isTestnet: false,
          rpcUri: { authentication: RPC_AUTHENTICATION.NO_AUTHENTICATION, value: 'https://rpc.url' },
          safeAppsRpcUri: { authentication: RPC_AUTHENTICATION.NO_AUTHENTICATION, value: 'https://rpc.url' },
          publicRpcUri: { authentication: RPC_AUTHENTICATION.NO_AUTHENTICATION, value: 'https://rpc.url' },
          blockExplorerUriTemplate: {
            address: 'https://polygonscan.com/address/{{address}}',
            txHash: 'https://polygonscan.com/tx/{{txHash}}',
            api: 'https://api.polygonscan.com/api?module={{module}}&action={{action}}&address={{address}}&apiKey={{apiKey}}',
          },
          nativeCurrency: { name: 'Matic', symbol: 'MATIC', decimals: 18, logoUri: 'matic.svg' },
          theme: { textColor: '#ffffff', backgroundColor: '#8248E5' },
          ensRegistryAddress: null,
          contractAddresses: {
            createCallAddress: null,
            fallbackHandlerAddress: null,
            multiSendAddress: null,
            multiSendCallOnlyAddress: null,
            safeProxyFactoryAddress: null,
            safeSingletonAddress: null,
            safeWebAuthnSignerFactoryAddress: null,
            signMessageLibAddress: null,
            simulateTxAccessorAddress: null,
          },
          gasPrice: [],
          disabledWallets: [],
          features: [],
          balancesProvider: {
            chainName: null,
            enabled: false,
          },
          recommendedMasterCopyVersion: '1.4.1',
        },
      ]

      mockIsWalletConnect.mockReturnValue(true)

      trackWalletType(wallet, configs)

      expect(mockTrackEvent).toHaveBeenCalledWith(
        {
          event: 'wallet_connect',
          label: 'WalletConnect',
        },
        {
          'EOA Wallet Label': 'WalletConnect',
          'EOA Wallet Address': '0x1234567890123456789012345678901234567890',
          'EOA Wallet Network': 'Polygon',
        },
      )

      expect(mockTrackEvent).toHaveBeenCalledWith({
        event: 'wallet_connect_type',
        label: 'Trust Wallet',
      })
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
          transactionService: 'https://safe-transaction.mainnet.gnosis.io',
          chainId: '1',
          chainName: 'Ethereum',
          chainLogoUri: '',
          description: 'Ethereum Mainnet',
          shortName: 'eth',
          l2: false,
          isTestnet: false,
          rpcUri: { authentication: RPC_AUTHENTICATION.NO_AUTHENTICATION, value: 'https://rpc.url' },
          safeAppsRpcUri: { authentication: RPC_AUTHENTICATION.NO_AUTHENTICATION, value: 'https://rpc.url' },
          publicRpcUri: { authentication: RPC_AUTHENTICATION.NO_AUTHENTICATION, value: 'https://rpc.url' },
          blockExplorerUriTemplate: {
            address: 'https://etherscan.io/address/{{address}}',
            txHash: 'https://etherscan.io/tx/{{txHash}}',
            api: 'https://api.etherscan.io/api?module={{module}}&action={{action}}&address={{address}}&apiKey={{apiKey}}',
          },
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18, logoUri: 'eth.svg' },
          theme: { textColor: '#001428', backgroundColor: '#E8663D' },
          ensRegistryAddress: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
          contractAddresses: {
            createCallAddress: null,
            fallbackHandlerAddress: null,
            multiSendAddress: null,
            multiSendCallOnlyAddress: null,
            safeProxyFactoryAddress: null,
            safeSingletonAddress: null,
            safeWebAuthnSignerFactoryAddress: null,
            signMessageLibAddress: null,
            simulateTxAccessorAddress: null,
          },
          gasPrice: [],
          disabledWallets: [],
          features: [],
          balancesProvider: {
            chainName: null,
            enabled: false,
          },
          recommendedMasterCopyVersion: '1.4.1',
        },
      ]

      mockIsWalletConnect.mockReturnValue(false)

      trackWalletType(wallet, configs)

      expect(mockTrackEvent).toHaveBeenCalledWith(
        {
          event: 'wallet_connect',
          label: 'MetaMask',
        },
        {
          'EOA Wallet Label': 'MetaMask',
          'EOA Wallet Address': '0x1234567890123456789012345678901234567890',
          'EOA Wallet Network': 'Chain 999',
        },
      )
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
          transactionService: 'https://safe-transaction.mainnet.gnosis.io',
          chainId: '1',
          chainName: 'Ethereum',
          chainLogoUri: '',
          description: 'Ethereum Mainnet',
          shortName: 'eth',
          l2: false,
          isTestnet: false,
          rpcUri: { authentication: RPC_AUTHENTICATION.NO_AUTHENTICATION, value: 'https://rpc.url' },
          safeAppsRpcUri: { authentication: RPC_AUTHENTICATION.NO_AUTHENTICATION, value: 'https://rpc.url' },
          publicRpcUri: { authentication: RPC_AUTHENTICATION.NO_AUTHENTICATION, value: 'https://rpc.url' },
          blockExplorerUriTemplate: {
            address: 'https://etherscan.io/address/{{address}}',
            txHash: 'https://etherscan.io/tx/{{txHash}}',
            api: 'https://api.etherscan.io/api?module={{module}}&action={{action}}&address={{address}}&apiKey={{apiKey}}',
          },
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18, logoUri: 'eth.svg' },
          theme: { textColor: '#001428', backgroundColor: '#E8663D' },
          ensRegistryAddress: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
          contractAddresses: {
            createCallAddress: null,
            fallbackHandlerAddress: null,
            multiSendAddress: null,
            multiSendCallOnlyAddress: null,
            safeProxyFactoryAddress: null,
            safeSingletonAddress: null,
            safeWebAuthnSignerFactoryAddress: null,
            signMessageLibAddress: null,
            simulateTxAccessorAddress: null,
          },
          gasPrice: [],
          disabledWallets: [],
          features: [],
          balancesProvider: {
            chainName: null,
            enabled: false,
          },
          recommendedMasterCopyVersion: '1.4.1',
        },
      ]

      mockIsWalletConnect.mockReturnValue(true)

      trackWalletType(wallet, configs)

      expect(mockTrackEvent).toHaveBeenCalledWith(
        {
          event: 'wallet_connect',
          label: 'WalletConnect',
        },
        {
          'EOA Wallet Label': 'WalletConnect',
          'EOA Wallet Address': '0x1234567890123456789012345678901234567890',
          'EOA Wallet Network': 'Ethereum',
        },
      )

      expect(mockTrackEvent).toHaveBeenCalledWith({
        event: 'wallet_connect_type',
        label: 'Unknown',
      })
    })
  })
})
