import type {
  TransactionDetails,
  MultisigExecutionDetails,
  Operation,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { getSafeTxHashFromDetails } from '../safeTxHashCalculation'

describe('getSafeTxHashFromDetails', () => {
  const mockSafeAddress = '0x1234567890123456789012345678901234567890'
  const mockSafeTxHash = '0x96a96c11b8d013ff5d7a6ce960b22e961046cfa42eff422ac71c1daf6adef2e0'

  const createMockTxDetails = (overrides?: Partial<TransactionDetails>): TransactionDetails => {
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
      ...overrides,
    } as TransactionDetails
  }

  it('should return safeTxHash from detailedExecutionInfo when available', () => {
    const mockTxDetails = createMockTxDetails()

    const result = getSafeTxHashFromDetails(mockTxDetails)

    expect(result).toBe(mockSafeTxHash)
  })

  it('should return null if detailedExecutionInfo is not multisig', () => {
    const mockTxDetails = createMockTxDetails({
      detailedExecutionInfo: {
        type: 'MODULE',
        address: { value: '0xmodule', name: null, logoUri: null },
      } as any,
    })

    const result = getSafeTxHashFromDetails(mockTxDetails)

    expect(result).toBeNull()
  })

  it('should return null if safeTxHash is empty string', () => {
    const mockTxDetails = createMockTxDetails()
    if (mockTxDetails.detailedExecutionInfo && mockTxDetails.detailedExecutionInfo.type === 'MULTISIG') {
      mockTxDetails.detailedExecutionInfo.safeTxHash = ''
    }

    const result = getSafeTxHashFromDetails(mockTxDetails)

    expect(result).toBeNull()
  })

  it('should return null if detailedExecutionInfo is missing', () => {
    const mockTxDetails = createMockTxDetails({
      detailedExecutionInfo: undefined as any,
    })

    const result = getSafeTxHashFromDetails(mockTxDetails)

    expect(result).toBeNull()
  })
})
