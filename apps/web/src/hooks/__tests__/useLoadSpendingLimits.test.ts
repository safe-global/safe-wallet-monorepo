import * as spendingLimit from '@/services/contracts/spendingLimitContracts'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import type { AllowanceModule } from '@safe-global/utils/types/contracts'
import { AllowanceModule__factory } from '@safe-global/utils/types/contracts'
import { getSpendingLimits, getTokenAllowances, getTokensForDelegates } from '../loadables/useLoadSpendingLimits'
import { TokenType } from '@safe-global/safe-gateway-typescript-sdk'
import { mockWeb3Provider } from '@/tests/test-utils'
import { createMockWeb3Provider } from '@safe-global/utils/tests/web3Provider'
import { faker } from '@faker-js/faker'

const spendingLimitInterface = AllowanceModule__factory.createInterface()
const mockProvider = createMockWeb3Provider([], undefined, '4')
const mockModule = {
  value: '0x1',
}

describe('getSpendingLimits', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.resetAllMocks()
  })

  it('should return undefined if no spending limit module address was found', async () => {
    jest.spyOn(spendingLimit, 'getDeployedSpendingLimitModuleAddress').mockReturnValue(undefined)

    const result = await getSpendingLimits(mockProvider, [], ZERO_ADDRESS, '4', [])

    expect(result).toBeUndefined()
  })

  it('should return undefined if the safe has no spending limit module', async () => {
    jest.spyOn(spendingLimit, 'getDeployedSpendingLimitModuleAddress').mockReturnValue('0x1')

    const result = await getSpendingLimits(mockProvider, [], ZERO_ADDRESS, '4', [])

    expect(result).toBeUndefined()
  })

  it('should fetch a list of delegates', async () => {
    const getDelegatesMock = jest.fn(() => ({ results: [] }))
    jest.spyOn(spendingLimit, 'getDeployedSpendingLimitModuleAddress').mockReturnValue('0x1')
    jest.spyOn(spendingLimit, 'getSpendingLimitContract').mockImplementation(
      jest.fn(() => {
        return {
          getDelegates: getDelegatesMock,
          getAddress: jest.fn().mockResolvedValue(faker.finance.ethereumAddress()),
        } as unknown as AllowanceModule
      }),
    )

    const mockModule = {
      value: '0x1',
    }

    await getSpendingLimits(mockProvider, [mockModule], ZERO_ADDRESS, '4', [])

    expect(getDelegatesMock).toHaveBeenCalledWith(ZERO_ADDRESS, 0, 100)
  })

  it('should return a flat list of spending limits', async () => {
    const spendingLimitAddress = faker.finance.ethereumAddress()
    const delegate1 = faker.finance.ethereumAddress()
    const delegate2 = faker.finance.ethereumAddress()
    const token1 = faker.finance.ethereumAddress()
    const token2 = faker.finance.ethereumAddress()
    const getDelegatesMock = jest.fn(() => ({ results: [delegate1, delegate2] }))

    const web3Provider = createMockWeb3Provider(
      [
        {
          signature: spendingLimitInterface.getFunction('getTokens')?.selector!,
          returnType: 'address[]',
          returnValue: [token1, token2],
        },
        {
          signature: spendingLimitInterface.getFunction('getTokenAllowance')?.selector!,
          returnType: 'uint256[5]',
          returnValue: [BigInt(1), BigInt(0), BigInt(0), BigInt(0), BigInt(0)],
        },
      ],
      undefined,
      '4',
    )

    jest.spyOn(spendingLimit, 'getDeployedSpendingLimitModuleAddress').mockReturnValue('0x1')
    jest.spyOn(spendingLimit, 'getSpendingLimitContract').mockImplementation(
      jest.fn(() => {
        return {
          getAddress: jest.fn().mockResolvedValue(spendingLimitAddress),
          getDelegates: getDelegatesMock,
          interface: spendingLimitInterface,
        } as unknown as AllowanceModule
      }),
    )

    const result = await getSpendingLimits(web3Provider, [mockModule], ZERO_ADDRESS, '4', [])

    expect(result?.length).toBe(4)

    // the requests should be optimized through using multicall:
    expect(web3Provider.call).toHaveBeenCalledTimes(2)
  })

  it('should filter out empty allowances', async () => {
    const spendingLimitAddress = faker.finance.ethereumAddress()
    const delegate1 = faker.finance.ethereumAddress()
    const delegate2 = faker.finance.ethereumAddress()
    const token1 = faker.finance.ethereumAddress()
    const token2 = faker.finance.ethereumAddress()
    const getDelegatesMock = jest.fn(() => ({ results: [delegate1, delegate2] }))

    const web3Provider = createMockWeb3Provider(
      [
        {
          signature: spendingLimitInterface.getFunction('getTokens')?.selector!,
          returnType: 'address[]',
          returnValue: [token1, token2],
        },
        {
          signature: spendingLimitInterface.getFunction('getTokenAllowance')?.selector!,
          returnType: 'uint256[5]',
          returnValue: [BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0)],
        },
      ],
      undefined,
      '4',
    )

    jest.spyOn(spendingLimit, 'getDeployedSpendingLimitModuleAddress').mockReturnValue('0x1')
    jest.spyOn(spendingLimit, 'getSpendingLimitContract').mockImplementation(
      jest.fn(() => {
        return {
          getAddress: jest.fn().mockResolvedValue(spendingLimitAddress),
          getDelegates: getDelegatesMock,
          interface: spendingLimitInterface,
        } as unknown as AllowanceModule
      }),
    )

    const result = await getSpendingLimits(web3Provider, [mockModule], ZERO_ADDRESS, '4', [])

    expect(result?.length).toBe(0)
  })
})

describe('getTokensForDelegates', () => {
  it('should fetch tokens for a given delegate', async () => {
    const delegate = faker.finance.ethereumAddress()
    const token1 = faker.finance.ethereumAddress()
    const token2 = faker.finance.ethereumAddress()
    const mockContract = {
      interface: spendingLimitInterface,
      getAddress: jest.fn().mockResolvedValue(faker.finance.ethereumAddress()),
    } as unknown as AllowanceModule

    const mockProvider = createMockWeb3Provider(
      [
        {
          signature: spendingLimitInterface.getFunction('getTokens')?.selector!,
          returnType: 'address[]',
          returnValue: [token1, token2],
        },
        {
          signature: spendingLimitInterface.getFunction('getTokenAllowance')?.selector!,
          returnType: 'uint256[5]',
          returnValue: [BigInt(1), BigInt(0), BigInt(0), BigInt(0), BigInt(0)],
        },
      ],
      undefined,
      '5',
    )
    const spendingLimits = await getTokensForDelegates(mockContract, mockProvider, ZERO_ADDRESS, [delegate], [])
    expect(spendingLimits.length).toBe(2)
  })
})

describe('getTokenAllowanceForDelegate', () => {
  it('should return contract values as strings', async () => {
    const mockContract = {
      getAddress: jest.fn().mockResolvedValue(faker.finance.ethereumAddress()),
      interface: spendingLimitInterface,
    } as unknown as AllowanceModule
    const delegate = faker.finance.ethereumAddress()
    const token = faker.finance.ethereumAddress()
    const mockProvider = createMockWeb3Provider(
      [
        {
          signature: spendingLimitInterface.getFunction('getTokenAllowance')?.selector!,
          returnType: 'uint256[5]',
          returnValue: [BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0)],
        },
      ],
      undefined,
      '5',
    )
    const result = (await getTokenAllowances(mockContract, mockProvider, ZERO_ADDRESS, [{ delegate, token }], []))[0]

    expect(result.beneficiary).toBe(delegate)
    expect(result.nonce).toBe('0')
    expect(result.amount).toBe('0')
    expect(result.spent).toBe('0')
    expect(result.lastResetMin).toBe('0')
    expect(result.resetTimeMin).toBe('0')
  })

  it('should return tokenInfo from balance', async () => {
    const mockContract = {
      getAddress: jest.fn().mockResolvedValue(faker.finance.ethereumAddress()),
      interface: spendingLimitInterface,
    } as unknown as AllowanceModule
    const delegate = faker.finance.ethereumAddress()
    const token = faker.finance.ethereumAddress()
    const mockProvider = createMockWeb3Provider(
      [
        {
          signature: spendingLimitInterface.getFunction('getTokenAllowance')?.selector!,
          returnType: 'uint256[5]',
          returnValue: [BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0)],
        },
      ],
      undefined,
      '5',
    )

    const mockTokenInfoFromBalances = [
      {
        address: token,
        name: 'Test',
        type: TokenType.ERC20,
        symbol: 'TST',
        decimals: 10,
        logoUri: 'https://mock.images/0x10.png',
      },
    ]

    const result = (
      await getTokenAllowances(
        mockContract,
        mockProvider,
        ZERO_ADDRESS,
        [{ delegate, token }],
        mockTokenInfoFromBalances,
      )
    )[0]

    expect(result.token.address).toBe(token)
    expect(result.token.decimals).toBe(10)
    expect(result.token.symbol).toBe('TST')
    expect(result.token.logoUri).toBe('https://mock.images/0x10.png')
  })

  it('should return tokenInfo from on-chain if not in balance', async () => {
    const mockContract = {
      getAddress: jest.fn().mockResolvedValue(faker.finance.ethereumAddress()),
      interface: spendingLimitInterface,
    } as unknown as AllowanceModule
    const delegate = faker.finance.ethereumAddress()
    const token = faker.finance.ethereumAddress()
    const mockProvider = mockWeb3Provider(
      [
        {
          signature: spendingLimitInterface.getFunction('getTokenAllowance')?.selector!,
          returnType: 'uint256[5]',
          returnValue: [BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0)],
        },
        {
          signature: 'decimals()',
          returnType: 'uint8',
          returnValue: 10,
        },
        {
          signature: 'symbol()',
          returnType: 'string',
          returnValue: 'TST',
        },
      ],
      undefined,
      '5',
    )

    const result = (await getTokenAllowances(mockContract, mockProvider, ZERO_ADDRESS, [{ delegate, token }], []))[0]

    expect(result.token.address).toBe(token)
    expect(result.token.decimals).toBe(10)
    expect(result.token.symbol).toBe('TST')
    expect(result.token.logoUri).toBe(undefined)
  })
})
