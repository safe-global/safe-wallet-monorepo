import { renderHook } from '@/src/tests/test-utils'
import { useTransactionSigner } from './useTransactionSigner'
import { faker } from '@faker-js/faker'
import type {
  TransactionDetails,
  MultisigExecutionDetails,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

// Mock the composed hooks
jest.mock('./useTransactionData', () => ({
  useTransactionData: jest.fn(),
}))

jest.mock('./useTxSignerState', () => ({
  useTxSignerState: jest.fn(),
}))

const mockUseTransactionData = require('./useTransactionData').useTransactionData
const mockUseTxSignerState = require('./useTxSignerState').useTxSignerState

// Helper functions to create mock data
const createMockMultisigExecutionDetails = (
  overrides: Partial<MultisigExecutionDetails> = {},
): MultisigExecutionDetails => ({
  type: 'MULTISIG',
  submittedAt: faker.date.past().getTime(),
  nonce: faker.number.int({ min: 1, max: 100 }),
  safeTxGas: faker.number.int({ min: 0, max: 100000 }).toString(),
  baseGas: faker.number.int({ min: 21000, max: 50000 }).toString(),
  gasPrice: faker.number.bigInt({ min: 1000000000n, max: 50000000000n }).toString(),
  gasToken: '0x0000000000000000000000000000000000000000',
  refundReceiver: { value: '0x0000000000000000000000000000000000000000', name: null, logoUri: null },
  safeTxHash: faker.string.hexadecimal({ length: 64, prefix: '0x' }),
  executor: { value: faker.finance.ethereumAddress() as `0x${string}`, name: null, logoUri: null },
  signers: [
    { value: faker.finance.ethereumAddress() as `0x${string}`, name: null, logoUri: null },
    { value: faker.finance.ethereumAddress() as `0x${string}`, name: null, logoUri: null },
  ],
  confirmationsRequired: faker.number.int({ min: 1, max: 5 }),
  confirmations: [
    {
      signer: { value: faker.finance.ethereumAddress() as `0x${string}`, name: null, logoUri: null },
      signature: faker.string.hexadecimal({ length: 130, prefix: '0x' }),
      submittedAt: faker.date.past().getTime(),
    },
  ],
  rejectors: [],
  gasTokenInfo: null,
  trusted: faker.datatype.boolean(),
  proposer: { value: faker.finance.ethereumAddress() as `0x${string}`, name: null, logoUri: null },
  ...overrides,
})

const createMockTransactionDetails = (overrides: Partial<TransactionDetails> = {}): TransactionDetails => {
  const detailedExecutionInfo = createMockMultisigExecutionDetails()

  return {
    txInfo: {
      type: 'Transfer',
      sender: { value: faker.finance.ethereumAddress() as `0x${string}`, name: null, logoUri: null },
      recipient: { value: faker.finance.ethereumAddress() as `0x${string}`, name: null, logoUri: null },
      direction: 'OUTGOING',
      transferInfo: {
        type: 'NATIVE_COIN',
        value: faker.number.bigInt({ min: 1000000000000000000n, max: 10000000000000000000n }).toString(),
      },
    },
    safeAddress: faker.finance.ethereumAddress() as `0x${string}`,
    txId: `multisig_${faker.finance.ethereumAddress()}_${faker.string.hexadecimal({ length: 64, prefix: '0x' })}`,
    executedAt: faker.date.past().getTime(),
    txStatus: 'SUCCESS',
    txHash: faker.string.hexadecimal({ length: 64, prefix: '0x' }),
    detailedExecutionInfo,
    ...overrides,
  } as TransactionDetails
}

const createMockSignerState = () => ({
  activeSigner: {
    value: faker.finance.ethereumAddress() as `0x${string}`,
    name: faker.person.fullName(),
    logoUri: faker.image.avatar(),
  },
  activeTxSigner: {
    value: faker.finance.ethereumAddress() as `0x${string}`,
    name: faker.person.fullName(),
    logoUri: faker.image.avatar(),
  },
  appSigners: [
    {
      value: faker.finance.ethereumAddress() as `0x${string}`,
      name: faker.person.fullName(),
      logoUri: faker.image.avatar(),
    },
  ],
  availableSigners: [
    {
      value: faker.finance.ethereumAddress() as `0x${string}`,
      name: faker.person.fullName(),
      logoUri: faker.image.avatar(),
    },
  ],
  proposedSigner: {
    value: faker.finance.ethereumAddress() as `0x${string}`,
    name: faker.person.fullName(),
    logoUri: faker.image.avatar(),
  },
  hasSigned: faker.datatype.boolean(),
  canSign: faker.datatype.boolean(),
})

describe('useTransactionSigner', () => {
  let mockTxDetails: TransactionDetails
  let mockSignerState: ReturnType<typeof createMockSignerState>
  let mockTxId: string

  beforeEach(() => {
    jest.clearAllMocks()

    // Generate fresh mock data for each test
    mockTxDetails = createMockTransactionDetails()
    mockSignerState = createMockSignerState()
    mockTxId = faker.string.alphanumeric(10)
  })

  describe('successful data composition', () => {
    it('should compose transaction data and signer state successfully', () => {
      // Mock useTransactionData
      mockUseTransactionData.mockReturnValue({
        data: mockTxDetails,
        isFetching: false,
        isError: false,
        error: undefined,
      })

      // Mock useTxSignerState
      mockUseTxSignerState.mockReturnValue(mockSignerState)

      const { result } = renderHook(() => useTransactionSigner(mockTxId))

      // Verify hook calls
      expect(mockUseTransactionData).toHaveBeenCalledWith(mockTxId)
      expect(mockUseTxSignerState).toHaveBeenCalledWith(mockTxDetails.detailedExecutionInfo)

      // Verify return values
      expect(result.current.txDetails).toEqual(mockTxDetails)
      expect(result.current.detailedExecutionInfo).toEqual(mockTxDetails.detailedExecutionInfo)
      expect(result.current.signerState).toEqual(mockSignerState)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.isError).toBe(false)
      expect(result.current.error).toBeUndefined()
    })

    it('should extract and memoize detailedExecutionInfo correctly', () => {
      mockUseTransactionData.mockReturnValue({
        data: mockTxDetails,
        isFetching: false,
        isError: false,
        error: undefined,
      })

      mockUseTxSignerState.mockReturnValue(mockSignerState)

      const { result, rerender } = renderHook(() => useTransactionSigner(mockTxId))

      const firstExecutionInfo = result.current.detailedExecutionInfo

      // Rerender without changing txDetails
      rerender({})

      const secondExecutionInfo = result.current.detailedExecutionInfo

      // Should be the same reference due to memoization
      expect(firstExecutionInfo).toBe(secondExecutionInfo)
      expect(firstExecutionInfo).toEqual(mockTxDetails.detailedExecutionInfo)
    })

    it('should update detailedExecutionInfo when txDetails change', () => {
      const initialTxDetails = mockTxDetails
      const updatedTxDetails = createMockTransactionDetails({
        txId: `different_${faker.string.alphanumeric(10)}`,
      })

      // Start with initial data
      mockUseTransactionData.mockReturnValue({
        data: initialTxDetails,
        isFetching: false,
        isError: false,
        error: undefined,
      })

      mockUseTxSignerState.mockReturnValue(mockSignerState)

      const { result, rerender } = renderHook(() => useTransactionSigner(mockTxId))

      const firstExecutionInfo = result.current.detailedExecutionInfo

      // Update with new data
      mockUseTransactionData.mockReturnValue({
        data: updatedTxDetails,
        isFetching: false,
        isError: false,
        error: undefined,
      })

      rerender({})

      const secondExecutionInfo = result.current.detailedExecutionInfo

      // Should be different references with different data
      expect(firstExecutionInfo).not.toBe(secondExecutionInfo)
      expect(firstExecutionInfo).toEqual(initialTxDetails.detailedExecutionInfo)
      expect(secondExecutionInfo).toEqual(updatedTxDetails.detailedExecutionInfo)
    })
  })

  describe('loading states', () => {
    it('should show loading state when transaction data is fetching', () => {
      mockUseTransactionData.mockReturnValue({
        data: undefined,
        isFetching: true,
        isError: false,
        error: undefined,
      })

      mockUseTxSignerState.mockReturnValue(mockSignerState)

      const { result } = renderHook(() => useTransactionSigner(mockTxId))

      expect(result.current.isLoading).toBe(true)
      expect(result.current.txDetails).toBeUndefined()
      expect(result.current.detailedExecutionInfo).toBeUndefined()
      expect(result.current.isError).toBe(false)
    })

    it('should show not loading when transaction data is loaded', () => {
      mockUseTransactionData.mockReturnValue({
        data: mockTxDetails,
        isFetching: false,
        isError: false,
        error: undefined,
      })

      mockUseTxSignerState.mockReturnValue(mockSignerState)

      const { result } = renderHook(() => useTransactionSigner(mockTxId))

      expect(result.current.isLoading).toBe(false)
      expect(result.current.txDetails).toEqual(mockTxDetails)
      expect(result.current.isError).toBe(false)
    })
  })

  describe('error states', () => {
    it('should handle error state from transaction data', () => {
      const mockError = new Error('Transaction fetch failed')

      mockUseTransactionData.mockReturnValue({
        data: undefined,
        isFetching: false,
        isError: true,
        error: mockError,
      })

      mockUseTxSignerState.mockReturnValue(mockSignerState)

      const { result } = renderHook(() => useTransactionSigner(mockTxId))

      expect(result.current.isError).toBe(true)
      expect(result.current.error).toEqual(mockError)
      expect(result.current.txDetails).toBeUndefined()
      expect(result.current.detailedExecutionInfo).toBeUndefined()
      expect(result.current.isLoading).toBe(false)
    })

    it('should still call useTxSignerState even when transaction data has error', () => {
      mockUseTransactionData.mockReturnValue({
        data: undefined,
        isFetching: false,
        isError: true,
        error: new Error('Fetch failed'),
      })

      mockUseTxSignerState.mockReturnValue(mockSignerState)

      renderHook(() => useTransactionSigner(mockTxId))

      // Should still call useTxSignerState with undefined
      expect(mockUseTxSignerState).toHaveBeenCalledWith(undefined)
    })
  })

  describe('parameter handling', () => {
    it('should pass txId to useTransactionData', () => {
      const customTxId = 'custom_tx_id_123'

      mockUseTransactionData.mockReturnValue({
        data: mockTxDetails,
        isFetching: false,
        isError: false,
        error: undefined,
      })

      mockUseTxSignerState.mockReturnValue(mockSignerState)

      renderHook(() => useTransactionSigner(customTxId))

      expect(mockUseTransactionData).toHaveBeenCalledWith(customTxId)
    })

    it('should pass detailedExecutionInfo to useTxSignerState', () => {
      const customExecutionInfo = createMockMultisigExecutionDetails({
        nonce: 999,
        confirmationsRequired: 3,
      })

      const customTxDetails = createMockTransactionDetails({
        detailedExecutionInfo: customExecutionInfo,
      })

      mockUseTransactionData.mockReturnValue({
        data: customTxDetails,
        isFetching: false,
        isError: false,
        error: undefined,
      })

      mockUseTxSignerState.mockReturnValue(mockSignerState)

      renderHook(() => useTransactionSigner(mockTxId))

      expect(mockUseTxSignerState).toHaveBeenCalledWith(customExecutionInfo)
    })

    it('should handle case when txDetails is undefined', () => {
      mockUseTransactionData.mockReturnValue({
        data: undefined,
        isFetching: false,
        isError: false,
        error: undefined,
      })

      mockUseTxSignerState.mockReturnValue(mockSignerState)

      const { result } = renderHook(() => useTransactionSigner(mockTxId))

      expect(mockUseTxSignerState).toHaveBeenCalledWith(undefined)
      expect(result.current.detailedExecutionInfo).toBeUndefined()
    })

    it('should handle case when detailedExecutionInfo is not MultisigExecutionDetails', () => {
      const moduleExecutionInfo = {
        type: 'MODULE' as const,
        address: { value: faker.finance.ethereumAddress() as `0x${string}`, name: null, logoUri: null },
      }

      const txDetailsWithoutMultisig = createMockTransactionDetails({
        detailedExecutionInfo: moduleExecutionInfo,
      })

      mockUseTransactionData.mockReturnValue({
        data: txDetailsWithoutMultisig,
        isFetching: false,
        isError: false,
        error: undefined,
      })

      mockUseTxSignerState.mockReturnValue(mockSignerState)

      const { result } = renderHook(() => useTransactionSigner(mockTxId))

      expect(result.current.detailedExecutionInfo).toEqual(txDetailsWithoutMultisig.detailedExecutionInfo)
      expect(mockUseTxSignerState).toHaveBeenCalledWith(txDetailsWithoutMultisig.detailedExecutionInfo)
    })
  })

  describe('hook composition edge cases', () => {
    it('should work when useTxSignerState returns different data', () => {
      const customSignerState = {
        ...mockSignerState,
        canSign: true,
        hasSigned: false,
        activeSigner: undefined,
      }

      mockUseTransactionData.mockReturnValue({
        data: mockTxDetails,
        isFetching: false,
        isError: false,
        error: undefined,
      })

      mockUseTxSignerState.mockReturnValue(customSignerState)

      const { result } = renderHook(() => useTransactionSigner(mockTxId))

      expect(result.current.signerState).toEqual(customSignerState)
      expect(result.current.signerState.canSign).toBe(true)
      expect(result.current.signerState.hasSigned).toBe(false)
      expect(result.current.signerState.activeSigner).toBeUndefined()
    })

    it('should update when txId changes', () => {
      const firstTxId = 'tx_id_1'
      const secondTxId = 'tx_id_2'

      mockUseTransactionData.mockReturnValue({
        data: mockTxDetails,
        isFetching: false,
        isError: false,
        error: undefined,
      })

      mockUseTxSignerState.mockReturnValue(mockSignerState)

      // Test with first txId
      renderHook(() => useTransactionSigner(firstTxId))
      expect(mockUseTransactionData).toHaveBeenCalledWith(firstTxId)

      // Test with second txId
      renderHook(() => useTransactionSigner(secondTxId))
      expect(mockUseTransactionData).toHaveBeenCalledWith(secondTxId)

      expect(mockUseTransactionData).toHaveBeenCalledTimes(2)
    })
  })
})
