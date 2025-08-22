import { type JsonRpcProvider, toBeHex } from 'ethers'
import { EMPTY_DATA } from '@safe-global/protocol-kit/dist/src/utils/constants'

import * as web3 from '@/hooks/wallets/web3'
import {
  isSmartContractWallet,
  isSmartContract,
  isEIP7702DelegatedAccount,
  EIP_7702_DELEGATED_ACCOUNT_PREFIX,
} from '@/utils/wallets'

describe('wallets', () => {
  const getCodeMock = jest.fn()

  beforeEach(() => {
    isSmartContractWallet.cache.clear?.()

    jest.clearAllMocks()

    jest.spyOn(web3, 'getWeb3ReadOnly').mockImplementation(() => {
      return {
        getCode: getCodeMock,
      } as unknown as JsonRpcProvider
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
