import { renderHook, waitFor } from '@testing-library/react-native'
import { useTransactionSecurity } from '../useTransactionSecurity'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useBlockaid } from '@/src/features/TransactionChecks/blockaid/useBlockaid'
import { useSafeInfo } from '@/src/hooks/useSafeInfo'
import { useHasFeature } from '@/src/hooks/useHasFeature'
import { createExistingTx } from '@/src/services/tx/tx-sender'
import extractTxInfo from '@/src/services/tx/extractTx'
import { SecuritySeverity } from '@safe-global/utils/services/security/modules/types'
import { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { SafeTransaction } from '@safe-global/types-kit'

// Mock all dependencies
jest.mock('@/src/store/hooks/activeSafe')
jest.mock('@/src/features/TransactionChecks/blockaid/useBlockaid')
jest.mock('@/src/hooks/useSafeInfo')
jest.mock('@/src/hooks/useHasFeature')
jest.mock('@/src/services/tx/tx-sender')
jest.mock('@/src/services/tx/extractTx')

const mockUseDefinedActiveSafe = useDefinedActiveSafe as jest.MockedFunction<typeof useDefinedActiveSafe>
const mockUseBlockaid = useBlockaid as jest.MockedFunction<typeof useBlockaid>
const mockUseSafeInfo = useSafeInfo as jest.MockedFunction<typeof useSafeInfo>
const mockUseHasFeature = useHasFeature as jest.MockedFunction<typeof useHasFeature>
const mockCreateExistingTx = createExistingTx as jest.MockedFunction<typeof createExistingTx>
const mockExtractTxInfo = extractTxInfo as jest.MockedFunction<typeof extractTxInfo>

describe('useTransactionSecurity', () => {
  const mockTxDetails: TransactionDetails = {
    txId: 'test-tx-id',
    safeAddress: '0xSafeAddress',
    executedAt: null,
    txStatus: 'AWAITING_CONFIRMATIONS',
    txInfo: {
      type: 'Transfer',
      humanDescription: 'Test transaction',
      sender: { value: '0xSender' },
      recipient: { value: '0xRecipient' },
      direction: 'OUTGOING',
      transferInfo: {
        type: 'NATIVE_COIN',
        value: '1000000000000000000',
      },
    },
    detailedExecutionInfo: {
      type: 'MULTISIG',
      submittedAt: Date.now(),
      nonce: 1,
      confirmationsRequired: 2,
      confirmationsSubmitted: 1,
    },
  } as unknown as TransactionDetails

  const mockScanTransaction = jest.fn()
  const mockBlockaidPayload = {
    severity: SecuritySeverity.MEDIUM,
    payload: {
      issues: [
        {
          severity: SecuritySeverity.MEDIUM,
          description: 'Test security issue',
        },
      ],
      contractManagement: [
        {
          type: 'PROXY_UPGRADE' as const,
          after: { address: '0x456' },
          before: { address: '0x789' },
        },
      ],
      balanceChange: [],
      error: undefined,
    },
  }

  const mockSafeInfo = {
    safe: {
      owners: [{ value: '0xOwner1' }, { value: '0xOwner2' }],
    },
  } as ReturnType<typeof useSafeInfo>

  const mockSafeTx = {
    data: {
      to: '0xRecipient',
      value: '1000000000000000000',
      data: '0x',
    },
  } as SafeTransaction

  beforeEach(() => {
    jest.clearAllMocks()

    mockUseDefinedActiveSafe.mockReturnValue({
      address: '0xSafeAddress',
      chainId: '1',
    })

    mockUseSafeInfo.mockReturnValue(mockSafeInfo)

    mockUseHasFeature.mockReturnValue(true)

    mockUseBlockaid.mockReturnValue({
      scanTransaction: mockScanTransaction,
      blockaidPayload: mockBlockaidPayload,
      error: undefined,
      loading: false,
      resetBlockaid: jest.fn(),
    })

    mockExtractTxInfo.mockReturnValue({
      txParams: {
        to: '0xRecipient',
        value: '1000000000000000000',
        data: '0x',
        operation: 0,
        safeTxGas: '0',
        baseGas: '0',
        gasPrice: '0',
        gasToken: '0x0000000000000000000000000000000000000000',
        refundReceiver: '0x0000000000000000000000000000000000000000',
        nonce: 1,
      },
      signatures: {},
    })

    mockCreateExistingTx.mockResolvedValue(mockSafeTx)
  })

  it('should return initial state when blockaid is disabled', () => {
    mockUseHasFeature.mockReturnValue(false)

    const { result } = renderHook(() => useTransactionSecurity(mockTxDetails))

    expect(result.current.enabled).toBe(false)
    expect(result.current.isScanning).toBe(false)
    expect(result.current.hasError).toBe(false)
    expect(result.current.isHighRisk).toBe(false) // MEDIUM severity is not HIGH
    expect(result.current.isMediumRisk).toBe(true)
    expect(result.current.hasWarnings).toBe(true)
    expect(result.current.hasIssues).toBe(true)
    expect(result.current.hasContractManagement).toBe(true)
  })

  it('should not scan when txDetails is undefined', () => {
    const { result } = renderHook(() => useTransactionSecurity(undefined))

    expect(mockScanTransaction).not.toHaveBeenCalled()
    expect(result.current.enabled).toBe(true)
  })

  it('should scan transaction when enabled and txDetails provided', async () => {
    renderHook(() => useTransactionSecurity(mockTxDetails))

    await waitFor(() => {
      expect(mockScanTransaction).toHaveBeenCalledWith({
        data: expect.any(Object),
        signer: '0xOwner1',
      })
    })
  })

  it('should handle scanning errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {
      // Mock implementation for console.error
    })
    mockCreateExistingTx.mockRejectedValue(new Error('Scan failed'))

    renderHook(() => useTransactionSecurity(mockTxDetails))

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error running blockaid scan:', expect.any(Error))
    })

    consoleErrorSpy.mockRestore()
  })

  it('should correctly identify high risk transactions', () => {
    mockUseBlockaid.mockReturnValue({
      scanTransaction: mockScanTransaction,
      blockaidPayload: {
        severity: SecuritySeverity.HIGH,
        payload: {
          issues: [],
          contractManagement: [],
          balanceChange: [],
          error: undefined,
        },
      },
      error: undefined,
      loading: false,
      resetBlockaid: jest.fn(),
    })

    const { result } = renderHook(() => useTransactionSecurity(mockTxDetails))

    expect(result.current.isHighRisk).toBe(true)
    expect(result.current.isMediumRisk).toBe(false)
  })

  it('should correctly identify medium risk transactions', () => {
    mockUseBlockaid.mockReturnValue({
      scanTransaction: mockScanTransaction,
      blockaidPayload: {
        severity: SecuritySeverity.MEDIUM,
        payload: {
          issues: [],
          contractManagement: [],
          balanceChange: [],
          error: undefined,
        },
      },
      error: undefined,
      loading: false,
      resetBlockaid: jest.fn(),
    })

    const { result } = renderHook(() => useTransactionSecurity(mockTxDetails))

    expect(result.current.isHighRisk).toBe(false)
    expect(result.current.isMediumRisk).toBe(true)
  })

  it('should detect security issues correctly', () => {
    mockUseBlockaid.mockReturnValue({
      scanTransaction: mockScanTransaction,
      blockaidPayload: {
        severity: SecuritySeverity.MEDIUM,
        payload: {
          issues: [
            {
              severity: SecuritySeverity.MEDIUM,
              description: 'Suspicious activity detected',
            },
          ],
          contractManagement: [],
          balanceChange: [],
          error: undefined,
        },
      },
      error: undefined,
      loading: false,
      resetBlockaid: jest.fn(),
    })

    const { result } = renderHook(() => useTransactionSecurity(mockTxDetails))

    expect(result.current.hasIssues).toBe(true)
    expect(result.current.hasContractManagement).toBe(false)
    expect(result.current.hasWarnings).toBe(true)
  })

  it('should detect contract management warnings correctly', () => {
    mockUseBlockaid.mockReturnValue({
      scanTransaction: mockScanTransaction,
      blockaidPayload: {
        severity: SecuritySeverity.NONE,
        payload: {
          issues: [],
          contractManagement: [
            {
              type: 'OWNERSHIP_CHANGE' as const,
              after: { owners: ['0x456'] },
              before: { owners: ['0x789'] },
            },
          ],
          balanceChange: [],
          error: undefined,
        },
      },
      error: undefined,
      loading: false,
      resetBlockaid: jest.fn(),
    })

    const { result } = renderHook(() => useTransactionSecurity(mockTxDetails))

    expect(result.current.hasIssues).toBe(false)
    expect(result.current.hasContractManagement).toBe(true)
    expect(result.current.hasWarnings).toBe(true)
  })

  it('should handle both issues and contract management warnings', () => {
    mockUseBlockaid.mockReturnValue({
      scanTransaction: mockScanTransaction,
      blockaidPayload: {
        severity: SecuritySeverity.MEDIUM,
        payload: {
          issues: [
            {
              severity: SecuritySeverity.MEDIUM,
              description: 'Security issue',
            },
          ],
          contractManagement: [
            {
              type: 'MODULES_CHANGE' as const,
              after: { modules: ['0x123'] },
              before: { modules: ['0x456'] },
            },
          ],
          balanceChange: [],
          error: undefined,
        },
      },
      error: undefined,
      loading: false,
      resetBlockaid: jest.fn(),
    })

    const { result } = renderHook(() => useTransactionSecurity(mockTxDetails))

    expect(result.current.hasIssues).toBe(true)
    expect(result.current.hasContractManagement).toBe(true)
    expect(result.current.hasWarnings).toBe(true)
  })

  it('should handle scanning state correctly', () => {
    mockUseBlockaid.mockReturnValue({
      scanTransaction: mockScanTransaction,
      blockaidPayload: undefined,
      error: undefined,
      loading: true,
      resetBlockaid: jest.fn(),
    })

    const { result } = renderHook(() => useTransactionSecurity(mockTxDetails))

    expect(result.current.isScanning).toBe(true)
    expect(result.current.payload).toBeUndefined()
  })

  it('should handle blockaid errors correctly', () => {
    const mockError = new Error('Blockaid API error')
    mockUseBlockaid.mockReturnValue({
      scanTransaction: mockScanTransaction,
      blockaidPayload: undefined,
      error: mockError,
      loading: false,
      resetBlockaid: jest.fn(),
    })

    const { result } = renderHook(() => useTransactionSecurity(mockTxDetails))

    expect(result.current.hasError).toBe(true)
    expect(result.current.error).toBe(mockError)
  })

  it('should not scan twice on re-renders', async () => {
    const { rerender } = renderHook((txDetails: TransactionDetails | undefined) => useTransactionSecurity(txDetails), {
      initialProps: mockTxDetails,
    })

    await waitFor(() => {
      expect(mockScanTransaction).toHaveBeenCalledTimes(1)
    })

    // Re-render the hook
    rerender(mockTxDetails)

    // Should not scan again
    expect(mockScanTransaction).toHaveBeenCalledTimes(1)
  })

  it('should handle empty scan results correctly', () => {
    mockUseBlockaid.mockReturnValue({
      scanTransaction: mockScanTransaction,
      blockaidPayload: {
        severity: SecuritySeverity.NONE,
        payload: {
          issues: [],
          contractManagement: [],
          balanceChange: [],
          error: undefined,
        },
      },
      error: undefined,
      loading: false,
      resetBlockaid: jest.fn(),
    })

    const { result } = renderHook(() => useTransactionSecurity(mockTxDetails))

    expect(result.current.isHighRisk).toBe(false)
    expect(result.current.isMediumRisk).toBe(false)
    expect(result.current.hasIssues).toBe(false)
    expect(result.current.hasContractManagement).toBe(false)
    expect(result.current.hasWarnings).toBe(false)
  })
})
