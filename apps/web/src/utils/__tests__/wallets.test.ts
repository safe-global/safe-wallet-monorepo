import { type JsonRpcProvider, toBeHex } from 'ethers'
import { EMPTY_DATA } from '@safe-global/protocol-kit/dist/src/utils/constants'

import * as web3ReadOnly from '@/hooks/wallets/web3ReadOnly'
import {
  isSmartContractWallet,
  isSmartContract,
  isEIP7702DelegatedAccount,
  EIP_7702_DELEGATED_ACCOUNT_PREFIX,
  isWalletUnlocked,
} from '@/utils/wallets'

describe('wallets', () => {
  const getCodeMock = jest.fn()

  beforeEach(() => {
    isSmartContractWallet.cache.clear?.()

    jest.clearAllMocks()

    jest.spyOn(web3ReadOnly, 'getWeb3ReadOnly').mockImplementation(() => {
      return {
        getCode: getCodeMock,
      } as unknown as JsonRpcProvider
    })
  })

  describe('isWalletUnlocked', () => {
    const originalWindow = global.window

    beforeEach(() => {
      Object.defineProperty(global, 'window', {
        value: { ...originalWindow, ethereum: undefined },
        writable: true,
      })
    })

    afterEach(() => {
      Object.defineProperty(global, 'window', {
        value: originalWindow,
        writable: true,
      })
    })

    it('should return true for WalletConnect', async () => {
      const result = await isWalletUnlocked('WalletConnect')
      expect(result).toBe(true)
    })

    it('should return true for Private Key wallet', async () => {
      const result = await isWalletUnlocked('Private key')
      expect(result).toBe(true)
    })

    it('should return undefined for non-MetaMask wallets', async () => {
      const result = await isWalletUnlocked('Ledger')
      expect(result).toBe(undefined)
    })

    it('should return undefined when window.ethereum is not available', async () => {
      Object.defineProperty(global, 'window', {
        value: { ethereum: undefined },
        writable: true,
      })

      const result = await isWalletUnlocked('MetaMask')
      expect(result).toBe(undefined)
    })

    it('should return unlock status from single MetaMask provider', async () => {
      const isUnlockedMock = jest.fn().mockResolvedValue(true)
      Object.defineProperty(global, 'window', {
        value: {
          ethereum: {
            isMetaMask: true,
            _metamask: { isUnlocked: isUnlockedMock },
          },
        },
        writable: true,
      })

      const result = await isWalletUnlocked('MetaMask')
      expect(result).toBe(true)
      expect(isUnlockedMock).toHaveBeenCalled()
    })

    it('should find MetaMask in providers array when multiple wallets installed', async () => {
      const isUnlockedMock = jest.fn().mockResolvedValue(true)
      Object.defineProperty(global, 'window', {
        value: {
          ethereum: {
            isCoinbaseWallet: true,
            providers: [{ isCoinbaseWallet: true }, { isMetaMask: true, _metamask: { isUnlocked: isUnlockedMock } }],
          },
        },
        writable: true,
      })

      const result = await isWalletUnlocked('MetaMask')
      expect(result).toBe(true)
      expect(isUnlockedMock).toHaveBeenCalled()
    })

    it('should return undefined when MetaMask not found in providers array', async () => {
      Object.defineProperty(global, 'window', {
        value: {
          ethereum: {
            isCoinbaseWallet: true,
            providers: [{ isCoinbaseWallet: true }, { isPhantom: true }],
          },
        },
        writable: true,
      })

      const result = await isWalletUnlocked('MetaMask')
      expect(result).toBe(undefined)
    })

    it('should return undefined when isUnlocked throws an error', async () => {
      const isUnlockedMock = jest.fn().mockRejectedValue(new Error('Provider error'))
      Object.defineProperty(global, 'window', {
        value: {
          ethereum: {
            isMetaMask: true,
            _metamask: { isUnlocked: isUnlockedMock },
          },
        },
        writable: true,
      })

      const result = await isWalletUnlocked('MetaMask')
      expect(result).toBe(undefined)
    })
  })

  describe('isSmartContract', () => {
    it('should return true for accounts with bytecode', async () => {
      getCodeMock.mockResolvedValue('0x608060405234801561001057600080fd5b5')

      const result = await isSmartContract(toBeHex('0x1', 20))

      expect(result).toBe(true)
      expect(getCodeMock).toHaveBeenCalledWith(toBeHex('0x1', 20))
    })

    it('should return false for EOAs (empty bytecode)', async () => {
      getCodeMock.mockResolvedValue(EMPTY_DATA)

      const result = await isSmartContract(toBeHex('0x1', 20))

      expect(result).toBe(false)
    })
  })

  describe('isEIP7702DelegatedAccount', () => {
    it('should return true for EIP-7702 delegated accounts', async () => {
      const eip7702Code = EIP_7702_DELEGATED_ACCOUNT_PREFIX + '1234567890abcdef1234567890abcdef12345678'
      getCodeMock.mockResolvedValue(eip7702Code)

      const result = await isEIP7702DelegatedAccount(toBeHex('0x1', 20))

      expect(result).toBe(true)
    })

    it('should return false for regular smart contracts', async () => {
      getCodeMock.mockResolvedValue('0x608060405234801561001057600080fd5b5')

      const result = await isEIP7702DelegatedAccount(toBeHex('0x1', 20))

      expect(result).toBe(false)
    })

    it('should return false for EOAs', async () => {
      getCodeMock.mockResolvedValue(EMPTY_DATA)

      const result = await isEIP7702DelegatedAccount(toBeHex('0x1', 20))

      expect(result).toBe(false)
    })
  })

  describe('isSmartContractWallet', () => {
    it('should return true for regular smart contracts (not EIP-7702)', async () => {
      getCodeMock.mockResolvedValue('0x608060405234801561001057600080fd5b5') // Regular smart contract bytecode

      const result = await isSmartContractWallet('1', toBeHex('0x1', 20))

      expect(result).toBe(true)
    })

    it('should return false for EIP-7702 delegated accounts', async () => {
      const eip7702Code = EIP_7702_DELEGATED_ACCOUNT_PREFIX + '1234567890abcdef1234567890abcdef12345678'
      getCodeMock.mockResolvedValue(eip7702Code)

      const result = await isSmartContractWallet('1', toBeHex('0x1', 20))

      expect(result).toBe(false)
    })

    it('should return false for EOAs (empty bytecode)', async () => {
      getCodeMock.mockResolvedValue(EMPTY_DATA)

      const result = await isSmartContractWallet('1', toBeHex('0x1', 20))

      expect(result).toBe(false)
    })
  })
})
