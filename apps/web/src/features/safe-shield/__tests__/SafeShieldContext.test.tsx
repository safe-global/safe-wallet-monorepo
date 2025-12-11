import { renderHook, waitFor } from '@testing-library/react'
import { SafeShieldProvider, useSafeShield } from '../SafeShieldContext'
import { Severity, StatusGroup, ThreatStatus } from '@safe-global/utils/features/safe-shield/types'
import type { SafeTransaction } from '@safe-global/types-kit'
import { Safe__factory } from '@safe-global/utils/types/contracts'

jest.mock('../hooks', () => ({
  useRecipientAnalysis: jest.fn(() => undefined),
  useCounterpartyAnalysis: jest.fn(() => ({
    recipient: [undefined, undefined, false],
    contract: [undefined, undefined, false],
  })),
  useThreatAnalysis: jest.fn(),
}))

jest.mock('../components/useNestedTransaction', () => ({
  useNestedTransaction: jest.fn(),
}))

jest.mock('@/hooks/useChains', () => ({
  useCurrentChain: jest.fn(() => ({ chainId: '1' })),
}))

jest.mock('@/components/tx-flow/SafeTxProvider', () => ({
  SafeTxContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
  },
}))

const mockUseThreatAnalysis = jest.requireMock('../hooks').useThreatAnalysis
const mockUseNestedTransaction = jest.requireMock('../components/useNestedTransaction').useNestedTransaction

const safeInterface = Safe__factory.createInterface()

const NESTED_SAFE_ADDRESS = '0x00000000000000000000000000000000000000aa'
const APPROVE_HASH = `0x${'a'.repeat(64)}`

const buildSafeTransaction = (data: string): SafeTransaction => ({
  addSignature: jest.fn(),
  encodedSignatures: jest.fn(),
  getSignature: jest.fn(),
  signatures: new Map(),
  data: {
    to: NESTED_SAFE_ADDRESS,
    value: '0',
    data,
    operation: 0,
    safeTxGas: '0',
    baseGas: '0',
    gasPrice: '0',
    gasToken: '0x0000000000000000000000000000000000000000',
    refundReceiver: '0x0000000000000000000000000000000000000000',
    nonce: 0,
  },
})

const encodeApproveHash = (hash: string): string => safeInterface.encodeFunctionData('approveHash', [hash])

const buildThreatResult = (severity: Severity) => [
  {
    [StatusGroup.THREAT]: [
      {
        severity,
        type: ThreatStatus.MALICIOUS,
        title: `${severity} threat detected`,
        description: 'Test threat',
      },
    ],
  },
  undefined,
  false,
]

describe('SafeShieldContext - Nested Transaction Threat Detection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should detect threats in nested approveHash transactions', async () => {
    const approveHashTx = buildSafeTransaction(encodeApproveHash(APPROVE_HASH))
    const nestedSafeTx = buildSafeTransaction('0x1234')

    mockUseNestedTransaction.mockReturnValue({
      nestedSafeTx,
      isNested: true,
    })

    mockUseThreatAnalysis
      .mockReturnValueOnce(buildThreatResult(Severity.OK))
      .mockReturnValueOnce(buildThreatResult(Severity.CRITICAL))

    const wrapper = ({ children }: { children: React.ReactNode }) => <SafeShieldProvider>{children}</SafeShieldProvider>

    const { result } = renderHook(() => useSafeShield(), { wrapper })

    result.current.setSafeTx(approveHashTx)

    await waitFor(() => {
      expect(mockUseThreatAnalysis).toHaveBeenCalledTimes(2)
      expect(mockUseThreatAnalysis).toHaveBeenNthCalledWith(1, approveHashTx)
      expect(mockUseThreatAnalysis).toHaveBeenNthCalledWith(2, nestedSafeTx)
      expect(result.current.isNested).toBe(true)
      expect(result.current.needsRiskConfirmation).toBe(true)
    })
  })

  it('should prioritize the more severe threat from nested transaction', async () => {
    const approveHashTx = buildSafeTransaction(encodeApproveHash(APPROVE_HASH))
    const nestedSafeTx = buildSafeTransaction('0x1234')

    mockUseNestedTransaction.mockReturnValue({
      nestedSafeTx,
      isNested: true,
    })

    mockUseThreatAnalysis
      .mockReturnValueOnce(buildThreatResult(Severity.WARN))
      .mockReturnValueOnce(buildThreatResult(Severity.CRITICAL))

    const wrapper = ({ children }: { children: React.ReactNode }) => <SafeShieldProvider>{children}</SafeShieldProvider>

    const { result } = renderHook(() => useSafeShield(), { wrapper })

    result.current.setSafeTx(approveHashTx)

    await waitFor(() => {
      expect(result.current.needsRiskConfirmation).toBe(true)
    })
  })

  it('should not analyze nested transaction when isNested is false', async () => {
    const regularTx = buildSafeTransaction('0x1234')

    mockUseNestedTransaction.mockReturnValue({
      nestedSafeTx: undefined,
      isNested: false,
    })

    mockUseThreatAnalysis.mockReturnValue(buildThreatResult(Severity.OK))

    const wrapper = ({ children }: { children: React.ReactNode }) => <SafeShieldProvider>{children}</SafeShieldProvider>

    const { result } = renderHook(() => useSafeShield(), { wrapper })

    result.current.setSafeTx(regularTx)

    await waitFor(() => {
      expect(mockUseThreatAnalysis).toHaveBeenCalledWith(regularTx)
      expect(mockUseThreatAnalysis).toHaveBeenCalledWith(undefined)
      expect(result.current.isNested).toBe(false)
    })
  })

  it('should require risk confirmation for critical nested threats', async () => {
    const approveHashTx = buildSafeTransaction(encodeApproveHash(APPROVE_HASH))
    const nestedSafeTx = buildSafeTransaction('0x1234')

    mockUseNestedTransaction.mockReturnValue({
      nestedSafeTx,
      isNested: true,
    })

    mockUseThreatAnalysis
      .mockReturnValueOnce(buildThreatResult(Severity.OK))
      .mockReturnValueOnce(buildThreatResult(Severity.CRITICAL))

    const wrapper = ({ children }: { children: React.ReactNode }) => <SafeShieldProvider>{children}</SafeShieldProvider>

    const { result } = renderHook(() => useSafeShield(), { wrapper })

    result.current.setSafeTx(approveHashTx)

    await waitFor(() => {
      expect(result.current.needsRiskConfirmation).toBe(true)
      expect(result.current.isRiskConfirmed).toBe(false)
    })
  })

  it('should not require risk confirmation when both threats are OK', async () => {
    const approveHashTx = buildSafeTransaction(encodeApproveHash(APPROVE_HASH))
    const nestedSafeTx = buildSafeTransaction('0x1234')

    mockUseNestedTransaction.mockReturnValue({
      nestedSafeTx,
      isNested: true,
    })

    mockUseThreatAnalysis
      .mockReturnValueOnce(buildThreatResult(Severity.OK))
      .mockReturnValueOnce(buildThreatResult(Severity.OK))

    const wrapper = ({ children }: { children: React.ReactNode }) => <SafeShieldProvider>{children}</SafeShieldProvider>

    const { result } = renderHook(() => useSafeShield(), { wrapper })

    result.current.setSafeTx(approveHashTx)

    await waitFor(() => {
      expect(result.current.needsRiskConfirmation).toBe(false)
    })
  })
})
