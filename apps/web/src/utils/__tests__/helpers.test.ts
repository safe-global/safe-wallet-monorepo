import { getKeyWithTrueValue, assertTx, assertWallet, assertOnboard, assertChainInfo, assertProvider } from '../helpers'
import { faker } from '@faker-js/faker'
import type { SafeTransaction } from '@safe-global/types-kit'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import type { OnboardAPI } from '@web3-onboard/core'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { Eip1193Provider } from 'ethers'

describe('helpers', () => {
  describe('getKeyWithTrueValue', () => {
    const address1 = faker.finance.ethereumAddress()
    const address2 = faker.finance.ethereumAddress()
    const address3 = faker.finance.ethereumAddress()

    it('should return the address with value of true', async () => {
      const obj = {
        [address1]: false,
        [address2]: false,
        [address3]: true,
      }
      const result = getKeyWithTrueValue(obj)
      expect(result).toEqual(address3)
    })

    it('should return undefined when none of the objects properties are true', async () => {
      const obj = {
        [address1]: false,
        [address2]: false,
        [address3]: false,
      }
      const result = getKeyWithTrueValue(obj)
      expect(result).toEqual(undefined)
    })

    it('should return the first true value if there are more than one', async () => {
      const obj = {
        [address1]: true,
        [address2]: true,
        [address3]: true,
      }
      const result = getKeyWithTrueValue(obj)
      expect(result).toEqual(address1)
    })

    it('should handle empty object', () => {
      const obj = {}
      const result = getKeyWithTrueValue(obj)
      expect(result).toEqual(undefined)
    })

    it('should handle truthy non-boolean values', () => {
      const obj = {
        key1: 0, // falsy
        key2: '', // falsy
        key3: 1, // truthy
        key4: 'value', // truthy
      }
      const result = getKeyWithTrueValue(obj as any)
      expect(result).toEqual('key3')
    })
  })

  describe('assertTx', () => {
    it('should not throw for valid SafeTransaction', () => {
      const mockTx = {
        data: { to: '0x123', value: '0', data: '0x' },
      } as SafeTransaction

      expect(() => assertTx(mockTx)).not.toThrow()
    })

    it('should throw for undefined transaction', () => {
      expect(() => assertTx(undefined)).toThrow('Transaction not provided')
    })

    it('should throw with invariant error for undefined', () => {
      expect(() => assertTx(undefined)).toThrow()
    })

    it('should pass through valid transaction without modification', () => {
      const mockTx = {
        data: { to: '0x456', value: '100', data: '0xabc' },
        signatures: new Map(),
      } as unknown as SafeTransaction

      assertTx(mockTx)
      // If we get here, assertion passed
      expect(mockTx.data.to).toBe('0x456')
    })
  })

  describe('assertWallet', () => {
    it('should not throw for connected wallet', () => {
      const mockWallet = {
        address: '0x123',
        chainId: '1',
        label: 'MetaMask',
        provider: {} as any,
      } as ConnectedWallet

      expect(() => assertWallet(mockWallet)).not.toThrow()
    })

    it('should throw for null wallet', () => {
      expect(() => assertWallet(null)).toThrow('Wallet not connected')
    })

    it('should pass through valid wallet without modification', () => {
      const mockWallet = {
        address: '0x789',
        chainId: '137',
        label: 'WalletConnect',
        provider: {} as any,
      } as ConnectedWallet

      assertWallet(mockWallet)
      expect(mockWallet.address).toBe('0x789')
    })
  })

  describe('assertOnboard', () => {
    it('should not throw for valid OnboardAPI', () => {
      const mockOnboard = {
        connectWallet: jest.fn(),
        disconnectWallet: jest.fn(),
        state: {
          get: jest.fn(),
          select: jest.fn(),
        },
      } as unknown as OnboardAPI

      expect(() => assertOnboard(mockOnboard)).not.toThrow()
    })

    it('should throw for undefined onboard', () => {
      expect(() => assertOnboard(undefined)).toThrow('Onboard not connected')
    })

    it('should pass through valid onboard instance', () => {
      const connectWalletMock = jest.fn()
      const mockOnboard = {
        connectWallet: connectWalletMock,
        disconnectWallet: jest.fn(),
      } as unknown as OnboardAPI

      assertOnboard(mockOnboard)
      expect(mockOnboard.connectWallet).toBe(connectWalletMock)
    })
  })

  describe('assertChainInfo', () => {
    it('should not throw for valid Chain info', () => {
      const mockChain = {
        chainId: '1',
        chainName: 'Ethereum',
        shortName: 'eth',
        nativeCurrency: {
          name: 'Ether',
          symbol: 'ETH',
          decimals: 18,
        },
      } as Chain

      expect(() => assertChainInfo(mockChain)).not.toThrow()
    })

    it('should throw for undefined chain info', () => {
      expect(() => assertChainInfo(undefined)).toThrow('No chain config available')
    })

    it('should pass through valid chain info', () => {
      const mockChain = {
        chainId: '137',
        chainName: 'Polygon',
        shortName: 'matic',
        nativeCurrency: {
          name: 'MATIC',
          symbol: 'MATIC',
          decimals: 18,
        },
      } as Chain

      assertChainInfo(mockChain)
      expect(mockChain.chainId).toBe('137')
    })
  })

  describe('assertProvider', () => {
    it('should not throw for valid Eip1193Provider', () => {
      const mockProvider = {
        request: jest.fn(),
      } as unknown as Eip1193Provider

      expect(() => assertProvider(mockProvider)).not.toThrow()
    })

    it('should throw for undefined provider', () => {
      expect(() => assertProvider(undefined)).toThrow('Provider not found')
    })

    it('should throw for null provider', () => {
      expect(() => assertProvider(null)).toThrow('Provider not found')
    })

    it('should pass through valid provider', () => {
      const requestMock = jest.fn()
      const mockProvider = {
        request: requestMock,
      } as unknown as Eip1193Provider

      assertProvider(mockProvider)
      expect(mockProvider.request).toBe(requestMock)
    })
  })

  describe('assert functions integration', () => {
    it('should allow TypeScript narrowing after assertion', () => {
      const maybeTx: SafeTransaction | undefined = {
        data: { to: '0x123', value: '0', data: '0x' },
      } as SafeTransaction

      // Before assertion, TypeScript sees it as potentially undefined
      assertTx(maybeTx)

      // After assertion, TypeScript knows it's defined
      // This would be a compile error without proper assertion
      const txTo = maybeTx.data.to
      expect(txTo).toBe('0x123')
    })

    it('should work in conditional logic', () => {
      const testFunction = (tx: SafeTransaction | undefined) => {
        assertTx(tx)
        return tx.data.to
      }

      const mockTx = {
        data: { to: '0xabc', value: '0', data: '0x' },
      } as SafeTransaction

      expect(testFunction(mockTx)).toBe('0xabc')
      expect(() => testFunction(undefined)).toThrow()
    })
  })
})
