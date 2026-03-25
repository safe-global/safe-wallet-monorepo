import type { AbstractProvider } from 'ethers'
import { batchLookupAddresses } from './batchLookup'
import * as multicallModule from '@safe-global/utils/utils/multicall'

jest.mock('@safe-global/utils/utils/multicall')
jest.mock('../exceptions', () => ({ logError: jest.fn() }))

const multicallMock = jest.mocked(multicallModule.multicall)
const mockProvider = {} as AbstractProvider

// The Universal Resolver's reverse() returns (name, resolvedAddress, reverseResolver, resolver)
// We need to encode this ABI response for tests
function encodeReverseResult(name: string, resolvedAddress: string): string {
  const { Interface } = jest.requireActual('ethers')
  const iface = new Interface([
    'function reverse(bytes) view returns (string name, address resolvedAddress, address reverseResolver, address resolver)',
  ])
  return iface.encodeFunctionResult('reverse', [
    name,
    resolvedAddress,
    '0x0000000000000000000000000000000000000000',
    '0x0000000000000000000000000000000000000000',
  ])
}

describe('batchLookupAddresses', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return empty record for empty input', async () => {
    const result = await batchLookupAddresses(mockProvider, [])
    expect(result).toEqual({})
    expect(multicallMock).not.toHaveBeenCalled()
  })

  it('should resolve ENS names for multiple addresses', async () => {
    const addr1 = '0x1234567890123456789012345678901234567890'
    const addr2 = '0xABCDEF0123456789ABCDEF0123456789ABCDEF01'

    multicallMock.mockResolvedValue([
      { success: true, returnData: encodeReverseResult('alice.eth', addr1) },
      { success: true, returnData: encodeReverseResult('bob.eth', addr2.toLowerCase()) },
    ])

    const result = await batchLookupAddresses(mockProvider, [addr1, addr2])

    expect(result).toEqual({
      [addr1]: 'alice.eth',
      [addr2]: 'bob.eth',
    })
    expect(multicallMock).toHaveBeenCalledTimes(1)
  })

  it('should return null for addresses without ENS names', async () => {
    const addr = '0x1234567890123456789012345678901234567890'

    multicallMock.mockResolvedValue([{ success: false, returnData: '0x' }])

    const result = await batchLookupAddresses(mockProvider, [addr])

    expect(result).toEqual({ [addr]: null })
  })

  it('should return null when forward verification fails', async () => {
    const addr = '0x1234567890123456789012345678901234567890'
    const differentAddr = '0x0000000000000000000000000000000000000001'

    multicallMock.mockResolvedValue([{ success: true, returnData: encodeReverseResult('fake.eth', differentAddr) }])

    const result = await batchLookupAddresses(mockProvider, [addr])

    expect(result).toEqual({ [addr]: null })
  })

  it('should return null for all addresses on multicall failure', async () => {
    const addr1 = '0x1234567890123456789012345678901234567890'
    const addr2 = '0xABCDEF0123456789ABCDEF0123456789ABCDEF01'

    multicallMock.mockRejectedValue(new Error('RPC error'))

    const result = await batchLookupAddresses(mockProvider, [addr1, addr2])

    expect(result).toEqual({ [addr1]: null, [addr2]: null })
  })

  it('should handle mixed results', async () => {
    const addr1 = '0x1234567890123456789012345678901234567890'
    const addr2 = '0xABCDEF0123456789ABCDEF0123456789ABCDEF01'

    multicallMock.mockResolvedValue([
      { success: true, returnData: encodeReverseResult('alice.eth', addr1) },
      { success: false, returnData: '0x' },
    ])

    const result = await batchLookupAddresses(mockProvider, [addr1, addr2])

    expect(result).toEqual({
      [addr1]: 'alice.eth',
      [addr2]: null,
    })
  })
})
