import * as web3 from '@/hooks/wallets/web3'
import { ERC20__factory } from '@safe-global/utils/types/contracts'
import { getERC20TokenInfoOnChain } from '@/utils/tokens'
import { faker } from '@faker-js/faker'
import { keccak256, toUtf8Bytes } from 'ethers'

describe('tokens', () => {
  describe('getERC20TokenInfoOnChain', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should return undefined if there is no provider', async () => {
      jest.spyOn(web3, 'getWeb3ReadOnly').mockReturnValue(undefined)

      const result = await getERC20TokenInfoOnChain(faker.finance.ethereumAddress())

      expect(result).toBeUndefined()
    })

    it('should return symbol and decimals for a token', async () => {
      jest.spyOn(web3, 'getWeb3ReadOnly').mockImplementation(
        () =>
          ({
            call: (tx: { data: string; to: string }) => {
              {
                const decimalsSigHash = keccak256(toUtf8Bytes('decimals()')).slice(0, 10)
                const symbolSigHash = keccak256(toUtf8Bytes('symbol()')).slice(0, 10)

                if (tx.data.startsWith(decimalsSigHash)) {
                  return ERC20__factory.createInterface().encodeFunctionResult('decimals', [18])
                }
                if (tx.data.startsWith(symbolSigHash)) {
                  return ERC20__factory.createInterface().encodeFunctionResult('symbol', ['UNI'])
                }
              }
            },
            _isProvider: true,
            resolveName: (name: string) => name,
          }) as any,
      )

      const result = await getERC20TokenInfoOnChain('0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984')

      expect(result?.symbol).toEqual('UNI')
      expect(result?.decimals).toEqual(18)
    })

    it('should decode bytes32 symbol', async () => {
      jest.spyOn(web3, 'getWeb3ReadOnly').mockImplementation(
        () =>
          ({
            call: (tx: { data: string; to: string }) => {
              {
                const decimalsSigHash = keccak256(toUtf8Bytes('decimals()')).slice(0, 10)
                const symbolSigHash = keccak256(toUtf8Bytes('symbol()')).slice(0, 10)

                if (tx.data.startsWith(decimalsSigHash)) {
                  return ERC20__factory.createInterface().encodeFunctionResult('decimals', [18])
                }
                if (tx.data.startsWith(symbolSigHash)) {
                  return Promise.reject({ value: '0x4d4b520000000000000000000000000000000000000000000000000000000000' })
                }
              }
            },
            _isProvider: true,
            resolveName: (name: string) => name,
          }) as any,
      )

      const result = await getERC20TokenInfoOnChain('0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984')

      expect(result?.symbol).toEqual('MKR')
      expect(result?.decimals).toEqual(18)
    })
  })
})
