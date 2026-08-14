import { type JsonRpcProvider, toBeHex } from 'ethers'
import { EMPTY_DATA } from '@safe-global/utils/utils/constants'

import * as web3ReadOnly from '@/hooks/wallets/web3ReadOnly'
import {
  isSmartContractWallet,
  isSmartContract,
  isEIP7702DelegatedAccount,
  EIP_7702_DELEGATED_ACCOUNT_PREFIX,
  isWalletUnlocked,
  isWalletRejection,
} from '@/utils/wallets'
import { PRIVATE_KEY_MODULE_LABEL } from '@/services/private-key-module/constants'

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
    const announceListeners: Array<() => void> = []

    // Simulates a wallet extension answering the EIP-6963 roll call
    const announceWallet = (name: string, request: jest.Mock) => {
      const onRequest = () => {
        window.dispatchEvent(
          new CustomEvent('eip6963:announceProvider', {
            detail: { info: { name }, provider: { request } },
          }),
        )
      }
      window.addEventListener('eip6963:requestProvider', onRequest)
      announceListeners.push(() => window.removeEventListener('eip6963:requestProvider', onRequest))
    }

    afterEach(() => {
      announceListeners.forEach((removeListener) => removeListener())
      announceListeners.length = 0
    })

    it('should return true for WalletConnect and the private key module without probing providers', async () => {
      expect(await isWalletUnlocked('WalletConnect')).toBe(true)
      expect(await isWalletUnlocked(PRIVATE_KEY_MODULE_LABEL)).toBe(true)
    })

    it('should return true when the announced provider reports authorized accounts', async () => {
      const request = jest.fn().mockResolvedValue(['0x1234'])
      announceWallet('MetaMask', request)

      expect(await isWalletUnlocked('MetaMask')).toBe(true)
      expect(request).toHaveBeenCalledWith({ method: 'eth_accounts' })
    })

    it('should return false when the announced provider reports no accounts (locked or unauthorized)', async () => {
      const request = jest.fn().mockResolvedValue([])
      announceWallet('MetaMask', request)

      expect(await isWalletUnlocked('MetaMask')).toBe(false)
    })

    it('should return false when the provider request throws', async () => {
      const request = jest.fn().mockRejectedValue(new Error('Provider error'))
      announceWallet('MetaMask', request)

      expect(await isWalletUnlocked('MetaMask')).toBe(false)
    })

    it('should return false when no provider announces itself', async () => {
      expect(await isWalletUnlocked('MetaMask')).toBe(false)
    })

    it('should only probe the provider matching the saved label', async () => {
      const braveRequest = jest.fn().mockResolvedValue(['0x1234'])
      const metaMaskRequest = jest.fn().mockResolvedValue([])
      announceWallet('Brave Wallet', braveRequest)
      announceWallet('MetaMask', metaMaskRequest)

      expect(await isWalletUnlocked('MetaMask')).toBe(false)
      expect(braveRequest).not.toHaveBeenCalled()
    })
  })

  describe('isWalletRejection', () => {
    it('detects an ethers ACTION_REJECTED error', () => {
      const err = Object.assign(new Error('user rejected action'), { code: 'ACTION_REJECTED' })
      expect(isWalletRejection(err)).toBe(true)
    })

    it('detects a lowercase rejection message', () => {
      expect(isWalletRejection(new Error('user rejected the request'))).toBe(true)
    })

    it('does not detect a bare capitalised "Rejected" (handled downstream by the error normalizer, WA-2950)', () => {
      expect(isWalletRejection(new Error('Rejected'))).toBe(false)
    })

    it('detects a WalletConnect "User rejected." reply', () => {
      expect(isWalletRejection(new Error('User rejected.'))).toBe(true)
    })

    it('does not flag unrelated errors', () => {
      expect(isWalletRejection(new Error('insufficient funds for gas'))).toBe(false)
    })

    it('does not flag genuine failures that merely contain a capitalised "Rejected"', () => {
      expect(isWalletRejection(new Error('Transaction Rejected by guard'))).toBe(false)
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

    it('should memoize successful results per chainId and address', async () => {
      getCodeMock.mockResolvedValue('0x608060405234801561001057600080fd5b5')

      await isSmartContractWallet('1', toBeHex('0x1', 20))
      await isSmartContractWallet('1', toBeHex('0x1', 20))

      expect(getCodeMock).toHaveBeenCalledTimes(2) // isSmartContract + isEIP7702DelegatedAccount, once each
    })

    it('should not cache a failed check and retry on the next call', async () => {
      getCodeMock.mockRejectedValueOnce(new Error('Provider not found'))

      await expect(isSmartContractWallet('1', toBeHex('0x1', 20))).rejects.toThrow('Provider not found')

      getCodeMock.mockResolvedValue('0x608060405234801561001057600080fd5b5')

      const result = await isSmartContractWallet('1', toBeHex('0x1', 20))

      expect(result).toBe(true)
    })
  })
})
