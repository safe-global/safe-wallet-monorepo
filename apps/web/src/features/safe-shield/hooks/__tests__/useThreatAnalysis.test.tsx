import { renderHook, waitFor } from '@testing-library/react'
import { useThreatAnalysis } from '../useThreatAnalysis'
import { Severity, StatusGroup, ThreatStatus } from '@safe-global/utils/features/safe-shield/types'
import type { SafeTransaction } from '@safe-global/types-kit'
import { Safe__factory } from '@safe-global/utils/types/contracts'

jest.mock('@safe-global/utils/features/safe-shield/hooks', () => ({
  useThreatAnalysis: jest.fn(),
  useThreatAnalysisHypernative: jest.fn(),
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

const mockUseIsHypernativeGuard = jest.fn(() => ({ isHypernativeGuard: false, loading: false }))

jest.mock('@/features/hypernative/hooks/useIsHypernativeGuard', () => ({
  useIsHypernativeGuard: () => mockUseIsHypernativeGuard(),
}))

jest.mock('../useNestedThreatAnalysis', () => ({
  useNestedThreatAnalysis: jest.fn(),
}))

const mockUseThreatAnalysisUtils = jest.requireMock('@safe-global/utils/features/safe-shield/hooks').useThreatAnalysis
const mockUseThreatAnalysisHypernative = jest.requireMock(
  '@safe-global/utils/features/safe-shield/hooks',
).useThreatAnalysisHypernative
const mockUseNestedTransaction = jest.requireMock('../../components/useNestedTransaction').useNestedTransaction
const mockUseNestedThreatAnalysis = jest.requireMock('../useNestedThreatAnalysis').useNestedThreatAnalysis

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
    mockUseIsHypernativeGuard.mockReturnValue({ isHypernativeGuard: false, loading: false })
    mockUseThreatAnalysisHypernative.mockReturnValue([undefined, undefined, false])
    mockUseNestedThreatAnalysis.mockReturnValue([undefined, undefined, false])
  })

  it('should return loading state while nested transaction data is being fetched', async () => {
    const approveHashTx = buildSafeTransaction(encodeApproveHash(APPROVE_HASH))

    mockUseNestedTransaction.mockReturnValue({
      nestedSafeInfo: undefined,
      nestedSafeTx: undefined,
      isNested: false,
      isNestedLoading: true,
    })

    mockUseThreatAnalysisUtils.mockReturnValue(buildThreatResult(Severity.OK))

    const { result } = renderHook(() => useThreatAnalysis(approveHashTx))

    await waitFor(() => {
      const [, , loading] = result.current
      expect(loading).toBe(true)
    })
  })

  it('should merge threats from nested approveHash transactions', async () => {
    const approveHashTx = buildSafeTransaction(encodeApproveHash(APPROVE_HASH))
    const nestedSafeTx = buildSafeTransaction('0x1234')

    mockUseNestedTransaction.mockReturnValue({
      nestedSafeInfo: buildNestedSafeInfo(),
      nestedSafeTx,
      isNested: true,
      isNestedLoading: false,
    })

    mockUseThreatAnalysisUtils.mockReturnValue(buildThreatResult(Severity.OK))
    mockUseNestedThreatAnalysis.mockReturnValue(buildThreatResult(Severity.CRITICAL))

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
      isNestedLoading: false,
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
      isNestedLoading: false,
    })

    mockUseThreatAnalysisUtils.mockReturnValue(buildThreatResult(Severity.OK))
    mockUseNestedThreatAnalysis.mockReturnValue(buildThreatResult(Severity.OK))

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
      isNestedLoading: false,
    })

    mockUseThreatAnalysisUtils.mockReturnValue([undefined, new Error('API error'), false])
    mockUseNestedThreatAnalysis.mockReturnValue(buildThreatResult(Severity.CRITICAL))

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
      isNestedLoading: false,
    })

    mockUseThreatAnalysisUtils.mockReturnValue(buildThreatResult(Severity.OK))
    mockUseNestedThreatAnalysis.mockReturnValue(buildThreatResult(Severity.OK))

    renderHook(() => useThreatAnalysis(approveHashTx))

    await waitFor(() => {
      expect(mockUseNestedThreatAnalysis).toHaveBeenCalledWith(approveHashTx, undefined)
    })
  })
})

describe('useThreatAnalysis - Hypernative Guard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseIsHypernativeGuard.mockReturnValue({ isHypernativeGuard: false, loading: false })
    mockUseThreatAnalysisHypernative.mockReturnValue([undefined, undefined, false])
    mockUseNestedThreatAnalysis.mockReturnValue([undefined, undefined, false])
    mockUseNestedTransaction.mockReturnValue({
      nestedSafeInfo: undefined,
      nestedSafeTx: undefined,
      isNested: false,
      isNestedLoading: false,
    })
  })

  it('should return loading state when Hypernative guard check is loading', async () => {
    const regularTx = buildSafeTransaction('0x1234')

    mockUseIsHypernativeGuard.mockReturnValue({ isHypernativeGuard: false, loading: true })
    mockUseThreatAnalysisUtils.mockReturnValue(buildThreatResult(Severity.OK))

    const { result } = renderHook(() => useThreatAnalysis(regularTx))

    await waitFor(() => {
      const [, , loading] = result.current
      expect(loading).toBe(true)
    })
  })

  it('should use Hypernative analysis when guard is enabled', async () => {
    const regularTx = buildSafeTransaction('0x1234')
    const authToken = 'test-auth-token'

    mockUseIsHypernativeGuard.mockReturnValue({ isHypernativeGuard: true, loading: false })
    mockUseThreatAnalysisHypernative.mockReturnValue(buildThreatResult(Severity.CRITICAL))

    const { result } = renderHook(() => useThreatAnalysis(regularTx, authToken))

    await waitFor(() => {
      const [threatResult] = result.current
      expect(threatResult?.THREAT).toHaveLength(1)
      expect(threatResult?.THREAT?.[0].severity).toBe(Severity.CRITICAL)
    })

    expect(mockUseThreatAnalysisHypernative).toHaveBeenCalledWith(
      expect.objectContaining({
        authToken,
        skip: false,
      }),
    )
    expect(mockUseThreatAnalysisUtils).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: true,
      }),
    )
  })

  it('should skip both analyses when guard is enabled but no auth token provided', async () => {
    const regularTx = buildSafeTransaction('0x1234')

    mockUseIsHypernativeGuard.mockReturnValue({ isHypernativeGuard: true, loading: false })
    mockUseThreatAnalysisHypernative.mockReturnValue([undefined, undefined, false])
    mockUseThreatAnalysisUtils.mockReturnValue(buildThreatResult(Severity.WARN))

    const { result } = renderHook(() => useThreatAnalysis(regularTx))

    await waitFor(() => {
      const [threatResult, , loading] = result.current
      expect(threatResult).toBeUndefined()
      expect(loading).toBe(false)
    })

    expect(mockUseThreatAnalysisHypernative).toHaveBeenCalledWith(
      expect.objectContaining({
        authToken: undefined,
        skip: true,
      }),
    )
    expect(mockUseThreatAnalysisUtils).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: true,
      }),
    )
  })

  it('should use Blockaid analysis when guard is disabled', async () => {
    const regularTx = buildSafeTransaction('0x1234')

    mockUseIsHypernativeGuard.mockReturnValue({ isHypernativeGuard: false, loading: false })
    mockUseThreatAnalysisUtils.mockReturnValue(buildThreatResult(Severity.WARN))

    const { result } = renderHook(() => useThreatAnalysis(regularTx))

    await waitFor(() => {
      const [threatResult] = result.current
      expect(threatResult?.THREAT).toHaveLength(1)
      expect(threatResult?.THREAT?.[0].severity).toBe(Severity.WARN)
    })

    expect(mockUseThreatAnalysisUtils).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: false,
      }),
    )
    expect(mockUseThreatAnalysisHypernative).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: true,
      }),
    )
  })

  it('should pass auth token to nested threat analysis', async () => {
    const approveHashTx = buildSafeTransaction(encodeApproveHash(APPROVE_HASH))
    const authToken = 'test-auth-token'

    mockUseNestedTransaction.mockReturnValue({
      nestedSafeInfo: buildNestedSafeInfo(),
      nestedSafeTx: buildSafeTransaction('0x1234'),
      isNested: true,
      isNestedLoading: false,
    })

    mockUseThreatAnalysisUtils.mockReturnValue(buildThreatResult(Severity.OK))
    mockUseNestedThreatAnalysis.mockReturnValue(buildThreatResult(Severity.OK))

    renderHook(() => useThreatAnalysis(approveHashTx, authToken))

    await waitFor(() => {
      expect(mockUseNestedThreatAnalysis).toHaveBeenCalledWith(approveHashTx, authToken)
    })
  })

  it('should merge threats from nested transactions with Hypernative guard enabled', async () => {
    const approveHashTx = buildSafeTransaction(encodeApproveHash(APPROVE_HASH))
    const authToken = 'test-auth-token'

    mockUseIsHypernativeGuard.mockReturnValue({ isHypernativeGuard: true, loading: false })
    mockUseNestedTransaction.mockReturnValue({
      nestedSafeInfo: buildNestedSafeInfo(),
      nestedSafeTx: buildSafeTransaction('0x1234'),
      isNested: true,
      isNestedLoading: false,
    })

    mockUseThreatAnalysisHypernative.mockReturnValue(buildThreatResult(Severity.CRITICAL))
    mockUseNestedThreatAnalysis.mockReturnValue(buildThreatResult(Severity.WARN))

    const { result } = renderHook(() => useThreatAnalysis(approveHashTx, authToken))

    await waitFor(() => {
      const [threatResult] = result.current
      expect(threatResult?.THREAT).toHaveLength(2)
      expect(threatResult?.THREAT?.[0].severity).toBe(Severity.CRITICAL)
      expect(threatResult?.THREAT?.[1].severity).toBe(Severity.WARN)
    })
  })

  it('should handle loading state from nested analysis when guard is enabled', async () => {
    const approveHashTx = buildSafeTransaction(encodeApproveHash(APPROVE_HASH))
    const authToken = 'test-auth-token'

    mockUseIsHypernativeGuard.mockReturnValue({ isHypernativeGuard: true, loading: false })
    mockUseNestedTransaction.mockReturnValue({
      nestedSafeInfo: buildNestedSafeInfo(),
      nestedSafeTx: buildSafeTransaction('0x1234'),
      isNested: true,
      isNestedLoading: false,
    })

    mockUseThreatAnalysisHypernative.mockReturnValue([undefined, undefined, true])
    mockUseNestedThreatAnalysis.mockReturnValue(buildThreatResult(Severity.OK))

    const { result } = renderHook(() => useThreatAnalysis(approveHashTx, authToken))

    await waitFor(() => {
      const [, , loading] = result.current
      expect(loading).toBe(true)
    })
  })
})
