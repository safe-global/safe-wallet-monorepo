import { faker } from '@faker-js/faker'
import type { EIP1193Provider, OnboardAPI, WalletState } from '@web3-onboard/core'
import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { getConnectedWallet, switchWallet, trackWalletType } from '../useOnboard'

// mock wallets
jest.mock('@/hooks/wallets/wallets', () => ({
  getDefaultWallets: jest.fn(() => []),
}))

// mock analytics
jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
  WALLET_EVENTS: {
    CONNECT: { action: 'connect_wallet' },
    WALLET_CONNECT: { action: 'wallet_connect' },
  },
  MixpanelEventParams: {
    EOA_WALLET_LABEL: 'EOA Wallet Label',
    EOA_WALLET_ADDRESS: 'EOA Wallet Address',
    EOA_WALLET_NETWORK: 'EOA Wallet Network',
  },
}))

// Import the mocked trackEvent
const { trackEvent } = require('@/services/analytics')

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
    beforeEach(() => {
      trackEvent.mockClear()
    })

    it('should track wallet connection with proper Mixpanel parameters', () => {
      const wallet = {
        label: 'MetaMask',
        chainId: '1',
        address: '0x1234567890123456789012345678901234567890',
        provider: {} as any,
      }

      const configs = [
        {
          chainId: '1',
          chainName: 'Ethereum',
        },
      ] as ChainInfo[]

      trackWalletType(wallet, configs)

      expect(trackEvent).toHaveBeenCalledWith(
        { action: 'connect_wallet', label: 'MetaMask' },
        {
          'EOA Wallet Label': 'MetaMask',
          'EOA Wallet Address': '0x1234567890123456789012345678901234567890',
          'EOA Wallet Network': 'Ethereum',
        },
      )
    })

    it('should use fallback network name when chain not found', () => {
      const wallet = {
        label: 'MetaMask',
        chainId: '999',
        address: '0x1234567890123456789012345678901234567890',
        provider: {} as any,
      }

      const configs = [
        {
          chainId: '1',
          chainName: 'Ethereum',
        },
      ] as ChainInfo[]

      trackWalletType(wallet, configs)

      expect(trackEvent).toHaveBeenCalledWith(
        { action: 'connect_wallet', label: 'MetaMask' },
        {
          'EOA Wallet Label': 'MetaMask',
          'EOA Wallet Address': '0x1234567890123456789012345678901234567890',
          'EOA Wallet Network': 'Chain 999',
        },
      )
    })

    it('should track additional WalletConnect event for WC wallets', () => {
      const wallet = {
        label: 'WalletConnect',
        chainId: '1',
        address: '0x1234567890123456789012345678901234567890',
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
      }

      const configs = [
        {
          chainId: '1',
          chainName: 'Ethereum',
        },
      ] as ChainInfo[]

      trackWalletType(wallet, configs)

      expect(trackEvent).toHaveBeenCalledTimes(2)
      expect(trackEvent).toHaveBeenNthCalledWith(2, {
        action: 'wallet_connect',
        label: 'Trust Wallet',
      })
    })
  })
})
