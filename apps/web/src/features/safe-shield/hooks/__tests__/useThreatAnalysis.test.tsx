import { renderHook, waitFor } from '@testing-library/react'
import { useThreatAnalysis } from '../useThreatAnalysis'
import { Severity, StatusGroup, ThreatStatus } from '@safe-global/utils/features/safe-shield/types'
import type { SafeTransaction } from '@safe-global/types-kit'
import { Safe__factory } from '@safe-global/utils/types/contracts'

jest.mock('@safe-global/utils/features/safe-shield/hooks', () => ({
  useThreatAnalysis: jest.fn(),
}))

jest.mock('../../components/useNestedTransaction', () => ({
  useNestedTransaction: jest.fn(),
}))

jest.mock('@/hooks/useChains', () => ({
  useCurrentChain: jest.fn(() => ({ chainId: '1' })),
}))

jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    safe: { chainId: '1', version: '1.3.0' },
    safeAddress: '0x123',
  })),
}))

jest.mock('@/hooks/wallets/useWallet', () => ({
  useSigner: jest.fn(() => ({ address: '0xWallet' })),
}))

jest.mock('@/components/tx-flow/SafeTxProvider', () => ({
  SafeTxContext: {
    _currentValue: {
      safeTx: undefined,
      safeMessage: undefined,
      txOrigin: undefined,
    },
  },
}))

jest.mock('@/features/hypernative/hooks/useIsHypernativeGuard', () => ({
  useIsHypernativeGuard: jest.fn(() => ({ isHypernativeGuard: false, loading: false })),
}))

const mockUseThreatAnalysisUtils = jest.requireMock('@safe-global/utils/features/safe-shield/hooks').useThreatAnalysis
const mockUseNestedTransaction = jest.requireMock('../../components/useNestedTransaction').useNestedTransaction

const safeInterface = Safe__factory.createInterface()

const NESTED_SAFE_ADDRESS = '0x00000000000000000000000000000000000000aa'
const APPROVE_HASH = `0x${'a'.repeat(64)}`

const buildNestedSafeInfo = () => ({
  address: { value: NESTED_SAFE_ADDRESS },
  chainId: '1',
  version: '1.4.1',
})

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

describe('useThreatAnalysis - Nested Transaction Detection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should merge threats from nested approveHash transactions', async () => {
    const approveHashTx = buildSafeTransaction(encodeApproveHash(APPROVE_HASH))
    const nestedSafeTx = buildSafeTransaction('0x1234')

    mockUseNestedTransaction.mockReturnValue({
      nestedSafeInfo: buildNestedSafeInfo(),
      nestedSafeTx,
      isNested: true,
    })

    mockUseThreatAnalysisUtils
      .mockReturnValueOnce(buildThreatResult(Severity.OK))
      .mockReturnValueOnce(buildThreatResult(Severity.CRITICAL))

    const { result } = renderHook(() => useThreatAnalysis(approveHashTx))

    await waitFor(
      () => {
        const [threatResult] = result.current
        expect(threatResult?.THREAT).toHaveLength(2)
        expect(threatResult?.THREAT?.[0].severity).toBe(Severity.OK)
        expect(threatResult?.THREAT?.[1].severity).toBe(Severity.CRITICAL)
      },
      { timeout: 3000 },
    )
  })

  it('should return only main threat when not nested', async () => {
    const regularTx = buildSafeTransaction('0x1234')

    mockUseNestedTransaction.mockReturnValue({
      nestedSafeInfo: undefined,
      nestedSafeTx: undefined,
      isNested: false,
    })

    mockUseThreatAnalysisUtils.mockReturnValue(buildThreatResult(Severity.WARN))

    const { result } = renderHook(() => useThreatAnalysis(regularTx))

    await waitFor(() => {
      const [threatResult] = result.current
      expect(threatResult?.THREAT).toHaveLength(1)
      expect(threatResult?.THREAT?.[0].severity).toBe(Severity.WARN)
    })
  })

  it('should handle both threats being OK', async () => {
    const approveHashTx = buildSafeTransaction(encodeApproveHash(APPROVE_HASH))
    const nestedSafeTx = buildSafeTransaction('0x1234')

    mockUseNestedTransaction.mockReturnValue({
      nestedSafeInfo: buildNestedSafeInfo(),
      nestedSafeTx,
      isNested: true,
    })

    mockUseThreatAnalysisUtils
      .mockReturnValueOnce(buildThreatResult(Severity.OK))
      .mockReturnValueOnce(buildThreatResult(Severity.OK))

    const { result } = renderHook(() => useThreatAnalysis(approveHashTx))

    await waitFor(() => {
      const [threatResult] = result.current
      expect(threatResult?.THREAT).toHaveLength(2)
      expect(threatResult?.THREAT?.every((t) => t.severity === Severity.OK)).toBe(true)
    })
  })

  it('should preserve nested threat data when main result is undefined', async () => {
    const approveHashTx = buildSafeTransaction(encodeApproveHash(APPROVE_HASH))
    const nestedSafeTx = buildSafeTransaction('0x1234')

    mockUseNestedTransaction.mockReturnValue({
      nestedSafeInfo: buildNestedSafeInfo(),
      nestedSafeTx,
      isNested: true,
    })

    mockUseThreatAnalysisUtils
      .mockReturnValueOnce([undefined, new Error('API error'), false])
      .mockReturnValueOnce(buildThreatResult(Severity.CRITICAL))

    const { result } = renderHook(() => useThreatAnalysis(approveHashTx))

    await waitFor(() => {
      const [threatResult, error] = result.current
      expect(threatResult?.THREAT).toHaveLength(1)
      expect(threatResult?.THREAT?.[0].severity).toBe(Severity.CRITICAL)
      expect(error).toBeInstanceOf(Error)
    })
  })

  it('should use nested Safe address and version for nested threat analysis', async () => {
    const approveHashTx = buildSafeTransaction(encodeApproveHash(APPROVE_HASH))
    const nestedSafeTx = buildSafeTransaction('0x1234')
    const nestedSafeInfo = buildNestedSafeInfo()

    mockUseNestedTransaction.mockReturnValue({
      nestedSafeInfo,
      nestedSafeTx,
      isNested: true,
    })

    mockUseThreatAnalysisUtils
      .mockReturnValueOnce(buildThreatResult(Severity.OK))
      .mockReturnValueOnce(buildThreatResult(Severity.OK))

    renderHook(() => useThreatAnalysis(approveHashTx))

    await waitFor(() => {
      expect(mockUseThreatAnalysisUtils).toHaveBeenCalledTimes(2)

      const mainCallArgs = mockUseThreatAnalysisUtils.mock.calls[0][0]
      expect(mainCallArgs.safeAddress).toBe('0x123')
      expect(mainCallArgs.safeVersion).toBe('1.3.0')

      const nestedCallArgs = mockUseThreatAnalysisUtils.mock.calls[1][0]
      expect(nestedCallArgs.safeAddress).toBe(NESTED_SAFE_ADDRESS)
      expect(nestedCallArgs.safeVersion).toBe('1.4.1')
    })
  })
})
