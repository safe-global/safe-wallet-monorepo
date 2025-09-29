import { TransactionData } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { formatParameters } from './formatParameters'

// Mock dependencies with minimal implementation
jest.mock('@/src/utils/transaction-guards', () => ({
  isArrayParameter: jest.fn(),
}))

jest.mock('@safe-global/utils/utils/formatters', () => ({
  shortenText: jest.fn((text: string) => text.slice(0, 15) + '...'),
}))

jest.mock('../formatters/singleValue', () => ({
  characterDisplayLimit: 15,
  formatValueTemplate: jest.fn((param) => ({
    label: param.name,
    value: param.value,
  })),
}))

jest.mock('../formatters/arrayValue', () => ({
  formatArrayValue: jest.fn((param) => ({
    label: `${param.name} (array)`,
    value: String(param.value),
  })),
}))

const { isArrayParameter } = require('@/src/utils/transaction-guards')
const { formatValueTemplate } = require('../formatters/singleValue')
const { formatArrayValue } = require('../formatters/arrayValue')

// Mock data helper to bypass strict typing for tests
const createMockTxData = (data: unknown) => data as TransactionData

describe('formatParameters', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return empty array when txData is undefined', () => {
    const result = formatParameters({ txData: undefined })
    expect(result).toEqual([])
  })

  it('should return empty array when txData is null', () => {
    const result = formatParameters({ txData: null })
    expect(result).toEqual([])
  })

  it('should return basic item when txData exists', () => {
    const txData = {
      to: { value: '0x123...' },
      dataDecoded: {
        method: 'transfer',
        parameters: [],
      },
      hexData: null,
      value: null,
      operation: 0,
    }

    const result = formatParameters({ txData })

    expect(result).toHaveLength(1)
    expect(result[0]).toHaveProperty('label')
  })

  it('should handle parameters with regular values', () => {
    const txData = createMockTxData({
      to: { value: '0x123...' },
      dataDecoded: {
        method: 'transfer',
        parameters: [
          { name: 'recipient', type: 'address', value: '0xabc...' },
          { name: 'amount', type: 'uint256', value: '1000' },
        ],
      },
      hexData: null,
      value: null,
      operation: 0,
    })

    isArrayParameter.mockImplementation(() => false)

    const result = formatParameters({ txData })

    expect(result).toHaveLength(3) // 1 basic + 2 parameters
    expect(formatValueTemplate).toHaveBeenCalledTimes(2)
  })

  it('should handle array parameters', () => {
    const txData = {
      to: { value: '0x123...' },
      dataDecoded: {
        method: 'batchTransfer',
        parameters: [{ name: 'recipients', type: 'address[]', value: ['0xabc...', '0xdef...'] }],
      },
      hexData: null,
      value: null,
      operation: 0,
    }

    isArrayParameter.mockImplementation((type: string) => type.endsWith('[]'))

    const result = formatParameters({ txData })

    expect(result).toHaveLength(2) // 1 basic + 1 array parameter
    expect(formatArrayValue).toHaveBeenCalledTimes(1)
  })

  it('should include hex data when present', () => {
    const txData = {
      to: { value: '0x123...' },
      dataDecoded: {
        method: 'transfer',
        parameters: [],
      },
      hexData: '0x1234567890abcdef1234567890abcdef',
      value: null,
      operation: 0,
    }

    const result = formatParameters({ txData })

    expect(result).toHaveLength(2) // 1 basic + 1 hex data
  })

  it('should handle missing dataDecoded', () => {
    const txData = {
      to: { value: '0x123...' },
      dataDecoded: null,
      hexData: '0x1234',
      value: null,
      operation: 0,
    }

    const result = formatParameters({ txData })

    expect(result).toHaveLength(2) // 1 basic + 1 hex data
  })

  it('should handle mixed parameter types', () => {
    const txData = createMockTxData({
      to: { value: '0x123...' },
      dataDecoded: {
        method: 'complexMethod',
        parameters: [
          { name: 'address', type: 'address', value: '0xabc...' },
          { name: 'amounts', type: 'uint256[]', value: ['100', '200'] },
          { name: 'data', type: 'bytes', value: ['0x123'] },
          { name: 'flag', type: 'bool', value: true },
        ],
      },
      hexData: '0xabcdef',
      value: null,
      operation: 0,
    })

    isArrayParameter.mockImplementation((type: string) => type.endsWith('[]'))

    const result = formatParameters({ txData })

    expect(result).toHaveLength(6) // 1 basic + 4 parameters + 1 hex data
    expect(formatValueTemplate).toHaveBeenCalledTimes(2) // address and flag
    expect(formatArrayValue).toHaveBeenCalledTimes(2) // amounts array and data with array value
  })
})
