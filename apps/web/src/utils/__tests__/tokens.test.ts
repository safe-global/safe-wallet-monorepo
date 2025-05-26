import * as web3 from '@/hooks/wallets/web3'
import { getERC20TokenInfoOnChain } from '@/utils/tokens'
import { faker } from '@faker-js/faker'
import { mockWeb3Provider } from '@/tests/test-utils'

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
      mockWeb3Provider([
        {
          signature: 'decimals()',
          returnType: 'uint256',
          returnValue: '18',
        },
        {
          signature: 'symbol()',
          returnType: 'string',
          returnValue: 'UNI',
        },
      ])

      const result = (await getERC20TokenInfoOnChain('0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'))?.[0]

      expect(result?.symbol).toEqual('UNI')
      expect(result?.decimals).toEqual(18)
    })

    it('should return symbol and decimals for multiple tokens', async () => {
      const token1Address = faker.finance.ethereumAddress()
      const token2Address = faker.finance.ethereumAddress()
      mockWeb3Provider([
        {
          signature: 'decimals()',
          returnType: 'uint256',
          returnValue: '18',
          to: token1Address,
        },
        {
          signature: 'symbol()',
          returnType: 'string',
          returnValue: 'UNI',
          to: token1Address,
        },
        {
          signature: 'decimals()',
          returnType: 'uint256',
          returnValue: '6',
          to: token2Address,
        },
        {
          signature: 'symbol()',
          returnType: 'string',
          returnValue: 'USDC',
          to: token2Address,
        },
      ])

      const result = await getERC20TokenInfoOnChain([token1Address, token2Address])

      expect(result).toHaveLength(2)
      expect(result?.[0].symbol).toEqual('UNI')
      expect(result?.[0].decimals).toEqual(18)
      expect(result?.[1].symbol).toEqual('USDC')
      expect(result?.[1].decimals).toEqual(6)
    })
    it('should decode bytes32 symbol', async () => {
      mockWeb3Provider([
        {
          signature: 'decimals()',
          returnType: 'uint256',
          returnValue: '18',
        },
        {
          signature: 'symbol()',
          returnType: 'bytes32',
          returnValue: '0x4d4b520000000000000000000000000000000000000000000000000000000000',
        },
      ])

      const result = (await getERC20TokenInfoOnChain('0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'))?.[0]

      expect(result?.symbol).toEqual('MKR')
      expect(result?.decimals).toEqual(18)
    })
  })
})
