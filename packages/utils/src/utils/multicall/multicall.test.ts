import { ethers } from 'ethers'
import { faker } from '@faker-js/faker'
import { multicall, getMultiCallAddress, MULTICALL_ABI } from '.'
import { createMockWeb3Provider } from '@safe-global/utils/tests/web3Provider'

const MULTICALL_INTERFACE = new ethers.Interface(MULTICALL_ABI)
describe('multicall', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return empty array for empty calls', async () => {
    const mockProvider = createMockWeb3Provider([], undefined, '1')
    const result = await multicall(mockProvider, [])
    expect(result).toEqual([])
  })

  it('should use fallback for chains without multicall support', async () => {
    const target1 = faker.finance.ethereumAddress()
    const target2 = faker.finance.ethereumAddress()
    const calls = [
      { to: target1, data: faker.string.hexadecimal({ length: 64 }) },
      { to: target2, data: faker.string.hexadecimal({ length: 64 }) },
    ]
    const mockProvider = createMockWeb3Provider(
      [
        {
          signature: calls[0].data.slice(0, 10),
          returnType: 'uint256',
          returnValue: 100,
        },
        {
          signature: calls[1].data.slice(0, 10),
          returnType: 'uint256',
          returnValue: 200,
        },
      ],
      undefined,
      '232',
    )

    const result = await multicall(mockProvider, calls)

    expect(result).toEqual([
      { success: true, returnData: ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [100]) },
      { success: true, returnData: ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [200]) },
    ])
    expect(mockProvider.call).toHaveBeenCalledTimes(2)
    expect(mockProvider.call).toHaveBeenCalledWith(calls[0])
    expect(mockProvider.call).toHaveBeenCalledWith(calls[1])
  })

  it('should use fallback for single call', async () => {
    const target = faker.finance.ethereumAddress()
    const calls = [{ to: target, data: faker.string.hexadecimal({ length: 64 }) }]
    const mockProvider = createMockWeb3Provider(
      [
        {
          signature: calls[0].data.slice(0, 10),
          returnType: 'uint256',
          returnValue: '100',
        },
      ],
      undefined,
      '1',
    )
    const result = await multicall(mockProvider, calls)

    expect(result).toEqual([
      { success: true, returnData: ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [100]) },
    ])
    expect(mockProvider.call).toHaveBeenCalledTimes(1)
    expect(mockProvider.call).toHaveBeenCalledWith(calls[0])
  })

  it('should use multicall contract for multiple calls on supported chain', async () => {
    const target1 = faker.finance.ethereumAddress()
    const target2 = faker.finance.ethereumAddress()
    const calls = [
      { to: target1, data: faker.string.hexadecimal({ length: 64 }) },
      { to: target2, data: faker.string.hexadecimal({ length: 64 }) },
    ]

    const expectedResults = [
      { success: true, returnData: ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [100]) },
      { success: true, returnData: ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [200]) },
    ]

    const mockProvider = createMockWeb3Provider(
      [
        {
          signature: MULTICALL_INTERFACE.getFunction('aggregate3')?.selector!,
          returnType: 'raw',
          returnValue: MULTICALL_INTERFACE.encodeFunctionResult('aggregate3', [expectedResults]),
        },
      ],
      undefined,
      '1',
    )

    const result = await multicall(mockProvider, calls)
    expect(result.every((r) => r.success)).toBe(true)
    expect(result[0].returnData).toEqual(expectedResults[0].returnData)
    expect(result[1].returnData).toEqual(expectedResults[1].returnData)

    expect(mockProvider.call).toHaveBeenCalledTimes(1)
  })
})

describe('getMultiCallAddress', () => {
  it('should return null for unsupported chains', () => {
    expect(getMultiCallAddress('232')).toBeNull() // Lens
  })

  it('should return canonical address for supported chains', () => {
    expect(getMultiCallAddress('1')).toBe('0xca11bde05977b3631167028862be2a173976ca11') // Ethereum Mainnet
    expect(getMultiCallAddress('137')).toBe('0xca11bde05977b3631167028862be2a173976ca11') // Polygon
  })
})
