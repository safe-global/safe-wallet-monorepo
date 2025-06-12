import { faker } from '@faker-js/faker'
import { formatTxDetails } from './formatTxDetails'
import { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Operation } from '@safe-global/safe-gateway-typescript-sdk'

// Mock dependencies
jest.mock('@safe-global/utils/utils/formatters', () => ({
  shortenText: jest.fn((text: string, limit: number) => text.slice(0, limit) + '...'),
}))

jest.mock('@/src/utils/transaction-guards', () => ({
  isMultisigDetailedExecutionInfo: jest.fn(),
}))

// Mock all UI components to return simple objects
jest.mock('../components/Receiver', () => ({
  Receiver: () => 'MockReceiver',
}))

jest.mock('@/src/components/Badge', () => ({
  Badge: () => 'MockBadge',
}))

jest.mock('@/src/components/CopyButton', () => ({
  CopyButton: () => 'MockCopyButton',
}))

jest.mock('@/src/components/EthAddress', () => ({
  EthAddress: () => 'MockEthAddress',
}))

jest.mock('@/src/components/Identicon', () => ({
  Identicon: () => 'MockIdenticon',
}))

jest.mock('@/src/components/SafeFontIcon', () => ({
  SafeFontIcon: () => 'MockSafeFontIcon',
}))

const { isMultisigDetailedExecutionInfo } = require('@/src/utils/transaction-guards')

// Helper to create minimal transaction details
const createMockTxDetails = (overrides: Partial<TransactionDetails> = {}): TransactionDetails => {
  return {
    txInfo: {} as TransactionDetails['txInfo'],
    txData: {
      to: { value: faker.finance.ethereumAddress() },
      value: null,
      operation: Operation.CALL,
      hexData: null,
      dataDecoded: null,
    },
    detailedExecutionInfo: null,
    txHash: null,
    safeAppInfo: null,
    txStatus: 'SUCCESS',
    txId: 'test-id',
    safeAddress: faker.finance.ethereumAddress(),
    ...overrides,
  }
}

describe('formatTxDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return empty array when txDetails is undefined', () => {
    const result = formatTxDetails({ txDetails: undefined })
    expect(result).toEqual([])
  })

  it('should return empty array when txDetails is null', () => {
    const result = formatTxDetails({ txDetails: null as unknown as TransactionDetails })
    expect(result).toEqual([])
  })

  it('should format basic transaction details with To field', () => {
    const mockAddress = faker.finance.ethereumAddress()
    const txDetails = createMockTxDetails({
      txData: {
        to: { value: mockAddress },
        value: null,
        operation: Operation.CALL,
        hexData: null,
        dataDecoded: null,
      },
    })

    const result = formatTxDetails({ txDetails })

    expect(result.length).toBeGreaterThanOrEqual(1)
    // Check that we have a 'To' field
    expect(result.some((item) => 'label' in item && item.label === 'To')).toBe(true)
  })

  it('should include Value field when transaction has value', () => {
    const txDetails = createMockTxDetails({
      txData: {
        to: { value: faker.finance.ethereumAddress() },
        value: '1000000000000000000', // 1 ETH in wei
        operation: Operation.CALL,
        hexData: null,
        dataDecoded: null,
      },
    })

    const result = formatTxDetails({ txDetails })

    // Check that we have a 'Value' field
    expect(result.some((item) => 'label' in item && item.label === 'Value')).toBe(true)
  })

  it('should include Operation field when operation is defined', () => {
    const txDetails = createMockTxDetails({
      txData: {
        to: { value: faker.finance.ethereumAddress() },
        value: null,
        operation: Operation.DELEGATE,
        hexData: null,
        dataDecoded: null,
      },
    })

    const result = formatTxDetails({ txDetails })

    // Check that we have an 'Operation' field
    expect(result.some((item) => 'label' in item && item.label === 'Operation')).toBe(true)
  })

  it('should include multisig execution details when available', () => {
    const mockExecutionInfo = {
      type: 'MULTISIG',
      nonce: 123,
      confirmationsRequired: 2,
      confirmationsSubmitted: 1,
      missingSigners: null,
      signers: [],
      submittedAt: 1234567890000,
      gasPrice: '20000000000',
      safeTxGas: '50000',
      baseGas: '21000',
      gasToken: faker.finance.ethereumAddress(),
      refundReceiver: { value: faker.finance.ethereumAddress() },
      safeTxHash: faker.string.hexadecimal({ length: 64 }),
    }

    const txDetails = createMockTxDetails({
      detailedExecutionInfo: mockExecutionInfo as unknown as TransactionDetails['detailedExecutionInfo'],
    })

    isMultisigDetailedExecutionInfo.mockReturnValue(true)

    const result = formatTxDetails({ txDetails })

    // Check for gas-related fields
    expect(result.some((item) => 'label' in item && item.label === 'SafeTxGas')).toBe(true)
    expect(result.some((item) => 'label' in item && item.label === 'BaseGas')).toBe(true)
    expect(result.some((item) => 'label' in item && item.label === 'GasPrice')).toBe(true)
    expect(result.some((item) => 'label' in item && item.label === 'GasToken')).toBe(true)
    expect(result.some((item) => 'label' in item && item.label === 'RefundReceiver')).toBe(true)
    expect(result.some((item) => 'label' in item && item.label === 'Nonce')).toBe(true)
    expect(result.some((item) => 'label' in item && item.label === 'Safe Tx Hash')).toBe(true)
  })

  it('should include transaction hash when available', () => {
    const mockTxHash = faker.string.hexadecimal({ length: 64 })
    const txDetails = createMockTxDetails({
      txHash: mockTxHash,
    })

    // Ensure multisig check returns false for this test
    isMultisigDetailedExecutionInfo.mockReturnValue(false)

    const result = formatTxDetails({ txDetails })

    // Check that we have a 'Transaction Hash' field
    expect(result.some((item) => 'label' in item && item.label === 'Transaction Hash')).toBe(true)
  })

  it('should not include optional fields when they are not present', () => {
    const txDetails = createMockTxDetails({
      txData: {
        to: { value: faker.finance.ethereumAddress() },
        value: null,
        operation: undefined,
        hexData: null,
        dataDecoded: null,
      },
    } as unknown as TransactionDetails)

    isMultisigDetailedExecutionInfo.mockReturnValue(false)

    const result = formatTxDetails({ txDetails })

    // Should only have the 'To' field
    expect(result).toHaveLength(1)
    expect(result.some((item) => 'label' in item && item.label === 'Value')).toBe(false)
    expect(result.some((item) => 'label' in item && item.label === 'Operation')).toBe(false)
    expect(result.some((item) => 'label' in item && item.label === 'Transaction Hash')).toBe(false)
  })

  it('should handle multisig execution without safeTxHash', () => {
    const mockExecutionInfo = {
      type: 'MULTISIG',
      nonce: 123,
      confirmationsRequired: 2,
      confirmationsSubmitted: 1,
      missingSigners: null,
      signers: [],
      submittedAt: 1234567890000,
      gasPrice: '20000000000',
      safeTxGas: '50000',
      baseGas: '21000',
      gasToken: faker.finance.ethereumAddress(),
      refundReceiver: { value: faker.finance.ethereumAddress() },
      safeTxHash: null, // No safe tx hash
    }

    const txDetails = createMockTxDetails({
      detailedExecutionInfo: mockExecutionInfo as unknown as TransactionDetails['detailedExecutionInfo'],
    })

    isMultisigDetailedExecutionInfo.mockReturnValue(true)

    const result = formatTxDetails({ txDetails })

    // Should have gas fields but not safe tx hash
    expect(result.some((item) => 'label' in item && item.label === 'SafeTxGas')).toBe(true)
    expect(result.some((item) => 'label' in item && item.label === 'Safe Tx Hash')).toBe(false)
  })

  it('should handle complete transaction with all fields', () => {
    const mockExecutionInfo = {
      type: 'MULTISIG',
      nonce: 123,
      confirmationsRequired: 2,
      confirmationsSubmitted: 1,
      missingSigners: null,
      signers: [],
      submittedAt: 1234567890000,
      gasPrice: '20000000000',
      safeTxGas: '50000',
      baseGas: '21000',
      gasToken: faker.finance.ethereumAddress(),
      refundReceiver: { value: faker.finance.ethereumAddress() },
      safeTxHash: faker.string.hexadecimal({ length: 64 }),
    }

    const txDetails = createMockTxDetails({
      txData: {
        to: { value: faker.finance.ethereumAddress() },
        value: '1000000000000000000',
        operation: Operation.DELEGATE,
        hexData: null,
        dataDecoded: null,
      },
      detailedExecutionInfo: mockExecutionInfo as unknown as TransactionDetails['detailedExecutionInfo'],
      txHash: faker.string.hexadecimal({ length: 64 }),
    })

    isMultisigDetailedExecutionInfo.mockReturnValue(true)

    const result = formatTxDetails({ txDetails })

    // Should have all possible fields
    expect(result.some((item) => 'label' in item && item.label === 'To')).toBe(true)
    expect(result.some((item) => 'label' in item && item.label === 'Value')).toBe(true)
    expect(result.some((item) => 'label' in item && item.label === 'Operation')).toBe(true)
    expect(result.some((item) => 'label' in item && item.label === 'SafeTxGas')).toBe(true)
    expect(result.some((item) => 'label' in item && item.label === 'Transaction Hash')).toBe(true)
    expect(result.some((item) => 'label' in item && item.label === 'Safe Tx Hash')).toBe(true)
  })
})
