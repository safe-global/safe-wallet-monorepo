import { renderHook } from '@/tests/test-utils'
import type {
  TransactionDetails,
  MultisigExecutionDetails,
  Operation,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useSafeTxHash } from '../HnSecurityReportBtnWithTxHash'
import * as safeTxHashCalculation from '../../../services/safeTxHashCalculation'

// Mock dependencies
jest.mock('../../../services/safeTxHashCalculation')

const mockGetSafeTxHashFromDetails = safeTxHashCalculation.getSafeTxHashFromDetails as jest.Mock

describe('useSafeTxHash', () => {
  const mockSafeAddress = '0x1234567890123456789012345678901234567890'
  const mockSafeTxHash = '0x96a96c11b8d013ff5d7a6ce960b22e961046cfa42eff422ac71c1daf6adef2e0'

  const createMockTxDetails = (): TransactionDetails => {
    const mockDetailedExecutionInfo: MultisigExecutionDetails = {
      type: 'MULTISIG',
      submittedAt: 1234567890,
      nonce: 10,
      safeTxGas: '0',
      baseGas: '0',
      gasPrice: '0',
      gasToken: '0x0000000000000000000000000000000000000000',
      refundReceiver: {
        value: '0x0000000000000000000000000000000000000000',
        name: null,
        logoUri: null,
      },
      safeTxHash: mockSafeTxHash,
      executor: null,
      signers: [],
      confirmationsRequired: 1,
      confirmations: [],
      rejectors: [],
      gasTokenInfo: null,
      trusted: true,
      proposer: null,
      proposedByDelegate: null,
    }

    return {
      safeAddress: mockSafeAddress,
      txId: 'multisig_0x123_0x456',
      executedAt: null,
      txStatus: 'AWAITING_CONFIRMATIONS',
      txInfo: {
        type: 'Custom',
        to: { value: '0xabcd', name: null, logoUri: null },
        dataSize: '0',
        value: '0',
        isCancellation: false,
      },
      txData: {
        hexData: '0x',
        dataDecoded: null,
        to: { value: '0xabcd', name: null, logoUri: null },
        value: '100',
        operation: 0 as Operation, // CALL
        trustedDelegateCallTarget: null,
        addressInfoIndex: null,
        tokenInfoIndex: null,
      },
      detailedExecutionInfo: mockDetailedExecutionInfo,
      txHash: null,
    } as TransactionDetails
  }

  beforeEach(() => {
    mockGetSafeTxHashFromDetails.mockReturnValue(mockSafeTxHash)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should call getSafeTxHashFromDetails with txDetails', () => {
    const mockTxDetails = createMockTxDetails()

    const { result } = renderHook(() => useSafeTxHash(mockTxDetails))

    expect(mockGetSafeTxHashFromDetails).toHaveBeenCalledWith(mockTxDetails)
    expect(result.current).toBe(mockSafeTxHash)
  })

  it('should return null when getSafeTxHashFromDetails returns null', () => {
    mockGetSafeTxHashFromDetails.mockReturnValue(null)

    const mockTxDetails = createMockTxDetails()

    const { result } = renderHook(() => useSafeTxHash(mockTxDetails))

    expect(result.current).toBeNull()
  })

  it('should memoize the result and not recalculate on re-render with same inputs', () => {
    const mockTxDetails = createMockTxDetails()

    const { rerender } = renderHook(() => useSafeTxHash(mockTxDetails))

    expect(mockGetSafeTxHashFromDetails).toHaveBeenCalledTimes(1)

    // Re-render with the same inputs
    rerender()

    // Should still only be called once due to memoization
    expect(mockGetSafeTxHashFromDetails).toHaveBeenCalledTimes(1)
  })

  it('should recalculate when txDetails change', () => {
    const mockTxDetails1 = createMockTxDetails()
    const mockTxDetails2 = createMockTxDetails()
    if (mockTxDetails2.detailedExecutionInfo && mockTxDetails2.detailedExecutionInfo.type === 'MULTISIG') {
      mockTxDetails2.detailedExecutionInfo.nonce = 11
    }

    const { rerender } = renderHook(({ txDetails }) => useSafeTxHash(txDetails), {
      initialProps: { txDetails: mockTxDetails1 },
    })

    expect(mockGetSafeTxHashFromDetails).toHaveBeenCalledTimes(1)

    // Re-render with different txDetails
    rerender({ txDetails: mockTxDetails2 })

    // Should be called again with new details
    expect(mockGetSafeTxHashFromDetails).toHaveBeenCalledTimes(2)
    expect(mockGetSafeTxHashFromDetails).toHaveBeenLastCalledWith(mockTxDetails2)
  })
})
