import { renderHook, waitFor } from '@testing-library/react'
import { useNestedThreatAnalysis } from '../useNestedThreatAnalysis'
import { Severity, StatusGroup, ThreatStatus } from '@safe-global/utils/features/safe-shield/types'
import type { SafeTransaction } from '@safe-global/types-kit'
import type { HypernativeEligibility } from '@/features/hypernative'

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

const buildEligibility = (overrides: Partial<HypernativeEligibility> = {}): HypernativeEligibility => ({
  isHypernativeEligible: false,
  isHypernativeGuard: false,
  isAllowlistedSafe: false,
  loading: false,
  ...overrides,
})

const mockUseIsHypernativeEligible = jest.fn(() => buildEligibility())
const mockUseIsHypernativeFeatureEnabled = jest.fn(() => true)

jest.mock('@/features/hypernative', () => ({
  useIsHypernativeEligible: () => mockUseIsHypernativeEligible(),
  useIsHypernativeFeatureEnabled: () => mockUseIsHypernativeFeatureEnabled(),
}))

const mockUseThreatAnalysisUtils = jest.requireMock('@safe-global/utils/features/safe-shield/hooks').useThreatAnalysis
const mockUseThreatAnalysisHypernative = jest.requireMock(
  '@safe-global/utils/features/safe-shield/hooks',
).useThreatAnalysisHypernative
const mockUseNestedTransaction = jest.requireMock('../../components/useNestedTransaction').useNestedTransaction

const NESTED_SAFE_ADDRESS = '0x00000000000000000000000000000000000000aa'
const MAIN_SAFE_ADDRESS = '0x123'

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

describe('useNestedThreatAnalysis', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseIsHypernativeEligible.mockReturnValue(buildEligibility({ isHypernativeEligible: false }))
    mockUseThreatAnalysisHypernative.mockReturnValue([undefined, undefined, false])
  })

  describe('Non-nested transactions', () => {
    it('should return undefined result when transaction is not nested', async () => {
      const regularTx = buildSafeTransaction('0x1234')

      mockUseNestedTransaction.mockReturnValue({
        nestedSafeInfo: undefined,
        nestedSafeTx: undefined,
        isNested: false,
      })

      const { result } = renderHook(() => useNestedThreatAnalysis(regularTx))

      await waitFor(() => {
        const [threatResult, error, loading] = result.current
        expect(threatResult).toBeUndefined()
        expect(error).toBeUndefined()
        expect(loading).toBe(false)
      })
    })

    it('should skip analysis hooks when transaction is not nested', async () => {
      const regularTx = buildSafeTransaction('0x1234')

      mockUseNestedTransaction.mockReturnValue({
        nestedSafeInfo: undefined,
        nestedSafeTx: undefined,
        isNested: false,
      })

      renderHook(() => useNestedThreatAnalysis(regularTx))

      await waitFor(() => {
        // Hooks are still called but with skip: true when not nested
        expect(mockUseThreatAnalysisUtils).toHaveBeenCalledWith(
          expect.objectContaining({
            skip: true,
          }),
        )
        expect(mockUseThreatAnalysisHypernative).toHaveBeenCalledWith(
          expect.objectContaining({
            skip: true,
          }),
        )
      })
    })
  })

  describe('Loading states', () => {
    it('should return loading state when Hypernative guard check is loading', async () => {
      const nestedTx = buildSafeTransaction('0x1234')

      mockUseIsHypernativeEligible.mockReturnValue(buildEligibility({ loading: true }))
      mockUseNestedTransaction.mockReturnValue({
        nestedSafeInfo: buildNestedSafeInfo(),
        nestedSafeTx: nestedTx,
        isNested: true,
      })
      mockUseThreatAnalysisUtils.mockReturnValue(buildThreatResult(Severity.OK))

      const { result } = renderHook(() => useNestedThreatAnalysis(nestedTx))

      await waitFor(() => {
        const [, , loading] = result.current
        expect(loading).toBe(true)
      })
    })

    it('should skip Blockaid analysis when Hypernative guard check is loading', async () => {
      const nestedTx = buildSafeTransaction('0x1234')

      mockUseIsHypernativeEligible.mockReturnValue(buildEligibility({ loading: true }))
      mockUseNestedTransaction.mockReturnValue({
        nestedSafeInfo: buildNestedSafeInfo(),
        nestedSafeTx: nestedTx,
        isNested: true,
      })
      mockUseThreatAnalysisUtils.mockReturnValue(buildThreatResult(Severity.OK))

      renderHook(() => useNestedThreatAnalysis(nestedTx))

      await waitFor(() => {
        // Blockaid should be skipped while guard check is loading to prevent unnecessary API calls
        expect(mockUseThreatAnalysisUtils).toHaveBeenCalledWith(
          expect.objectContaining({
            skip: true,
          }),
        )
      })
    })

    it('should return loading state when Blockaid analysis is loading', async () => {
      const nestedTx = buildSafeTransaction('0x1234')

      mockUseNestedTransaction.mockReturnValue({
        nestedSafeInfo: buildNestedSafeInfo(),
        nestedSafeTx: nestedTx,
        isNested: true,
      })
      mockUseThreatAnalysisUtils.mockReturnValue([undefined, undefined, true])

      const { result } = renderHook(() => useNestedThreatAnalysis(nestedTx))

      await waitFor(() => {
        const [, , loading] = result.current
        expect(loading).toBe(true)
      })
    })

    it('should return loading state when Hypernative analysis is loading', async () => {
      const nestedTx = buildSafeTransaction('0x1234')
      const authToken = 'test-auth-token'

      mockUseIsHypernativeEligible.mockReturnValue(buildEligibility({ isHypernativeEligible: true }))
      mockUseNestedTransaction.mockReturnValue({
        nestedSafeInfo: buildNestedSafeInfo(),
        nestedSafeTx: nestedTx,
        isNested: true,
      })
      mockUseThreatAnalysisHypernative.mockReturnValue([undefined, undefined, true])

      const { result } = renderHook(() => useNestedThreatAnalysis(nestedTx, authToken))

      await waitFor(() => {
        const [, , loading] = result.current
        expect(loading).toBe(true)
      })
    })
  })

  describe('Blockaid analysis', () => {
    it('should use Blockaid analysis when guard is disabled and transaction is nested', async () => {
      const nestedTx = buildSafeTransaction('0x1234')

      mockUseNestedTransaction.mockReturnValue({
        nestedSafeInfo: buildNestedSafeInfo(),
        nestedSafeTx: nestedTx,
        isNested: true,
      })
      mockUseThreatAnalysisUtils.mockReturnValue(buildThreatResult(Severity.CRITICAL))

      const { result } = renderHook(() => useNestedThreatAnalysis(nestedTx))

      await waitFor(() => {
        const [threatResult] = result.current
        expect(threatResult?.THREAT).toHaveLength(1)
        expect(threatResult?.THREAT?.[0].severity).toBe(Severity.CRITICAL)
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

    it('should skip Blockaid analysis when Hypernative guard is enabled', async () => {
      const nestedTx = buildSafeTransaction('0x1234')
      const authToken = 'test-auth-token'

      mockUseIsHypernativeEligible.mockReturnValue(buildEligibility({ isHypernativeEligible: true }))
      mockUseNestedTransaction.mockReturnValue({
        nestedSafeInfo: buildNestedSafeInfo(),
        nestedSafeTx: nestedTx,
        isNested: true,
      })
      mockUseThreatAnalysisHypernative.mockReturnValue(buildThreatResult(Severity.WARN))

      renderHook(() => useNestedThreatAnalysis(nestedTx, authToken))

      await waitFor(() => {
        expect(mockUseThreatAnalysisUtils).toHaveBeenCalledWith(
          expect.objectContaining({
            skip: true,
          }),
        )
      })
    })

    it('should not skip Blockaid analysis when guard is disabled and loading is false', async () => {
      const nestedTx = buildSafeTransaction('0x1234')

      mockUseIsHypernativeEligible.mockReturnValue(buildEligibility({ isHypernativeEligible: false }))
      mockUseNestedTransaction.mockReturnValue({
        nestedSafeInfo: buildNestedSafeInfo(),
        nestedSafeTx: nestedTx,
        isNested: true,
      })
      mockUseThreatAnalysisUtils.mockReturnValue(buildThreatResult(Severity.OK))

      renderHook(() => useNestedThreatAnalysis(nestedTx))

      await waitFor(() => {
        // Blockaid should not be skipped when guard is disabled and loading is complete
        expect(mockUseThreatAnalysisUtils).toHaveBeenCalledWith(
          expect.objectContaining({
            skip: false,
          }),
        )
      })
    })
  })

  describe('Hypernative analysis', () => {
    it('should use Hypernative analysis when guard is enabled and auth token is provided', async () => {
      const nestedTx = buildSafeTransaction('0x1234')
      const authToken = 'test-auth-token'

      mockUseIsHypernativeEligible.mockReturnValue(buildEligibility({ isHypernativeEligible: true }))
      mockUseNestedTransaction.mockReturnValue({
        nestedSafeInfo: buildNestedSafeInfo(),
        nestedSafeTx: nestedTx,
        isNested: true,
      })
      mockUseThreatAnalysisHypernative.mockReturnValue(buildThreatResult(Severity.CRITICAL))

      const { result } = renderHook(() => useNestedThreatAnalysis(nestedTx, authToken))

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
    })

    it('should return undefined when guard is enabled but no auth token provided', async () => {
      const nestedTx = buildSafeTransaction('0x1234')

      mockUseIsHypernativeEligible.mockReturnValue(buildEligibility({ isHypernativeEligible: true }))
      mockUseNestedTransaction.mockReturnValue({
        nestedSafeInfo: buildNestedSafeInfo(),
        nestedSafeTx: nestedTx,
        isNested: true,
      })
      mockUseThreatAnalysisHypernative.mockReturnValue([undefined, undefined, false])
      mockUseThreatAnalysisUtils.mockReturnValue(buildThreatResult(Severity.WARN))

      const { result } = renderHook(() => useNestedThreatAnalysis(nestedTx))

      await waitFor(() => {
        const [threatResult, , loading] = result.current
        // When Hypernative guard is enabled but no token, Hypernative analysis is skipped
        // and since guard is enabled, it uses Hypernative result (which is undefined)
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

    it('should skip Hypernative analysis when guard is disabled', async () => {
      const nestedTx = buildSafeTransaction('0x1234')
      const authToken = 'test-auth-token'

      mockUseIsHypernativeEligible.mockReturnValue(buildEligibility({ isHypernativeEligible: false }))
      mockUseNestedTransaction.mockReturnValue({
        nestedSafeInfo: buildNestedSafeInfo(),
        nestedSafeTx: nestedTx,
        isNested: true,
      })
      mockUseThreatAnalysisUtils.mockReturnValue(buildThreatResult(Severity.OK))

      renderHook(() => useNestedThreatAnalysis(nestedTx, authToken))

      await waitFor(() => {
        expect(mockUseThreatAnalysisHypernative).toHaveBeenCalledWith(
          expect.objectContaining({
            skip: true,
          }),
        )
      })
    })
  })

  describe('Nested Safe info usage', () => {
    it('should use nested Safe address and version when available', async () => {
      const nestedTx = buildSafeTransaction('0x1234')
      const nestedSafeInfo = buildNestedSafeInfo()

      mockUseNestedTransaction.mockReturnValue({
        nestedSafeInfo,
        nestedSafeTx: nestedTx,
        isNested: true,
      })
      mockUseThreatAnalysisUtils.mockReturnValue(buildThreatResult(Severity.OK))

      renderHook(() => useNestedThreatAnalysis(nestedTx))

      await waitFor(() => {
        expect(mockUseThreatAnalysisUtils).toHaveBeenCalledWith(
          expect.objectContaining({
            safeAddress: NESTED_SAFE_ADDRESS,
            safeVersion: '1.4.1',
            data: nestedTx,
          }),
        )
      })
    })

    it('should fall back to main Safe address and version when nested info is not available', async () => {
      const nestedTx = buildSafeTransaction('0x1234')

      mockUseNestedTransaction.mockReturnValue({
        nestedSafeInfo: undefined,
        nestedSafeTx: nestedTx,
        isNested: true,
      })
      mockUseThreatAnalysisUtils.mockReturnValue(buildThreatResult(Severity.OK))

      renderHook(() => useNestedThreatAnalysis(nestedTx))

      await waitFor(() => {
        expect(mockUseThreatAnalysisUtils).toHaveBeenCalledWith(
          expect.objectContaining({
            safeAddress: MAIN_SAFE_ADDRESS,
            safeVersion: '1.3.0',
            data: nestedTx,
          }),
        )
      })
    })

    it('should use nested Safe address with Hypernative analysis', async () => {
      const nestedTx = buildSafeTransaction('0x1234')
      const authToken = 'test-auth-token'
      const nestedSafeInfo = buildNestedSafeInfo()

      mockUseIsHypernativeEligible.mockReturnValue(buildEligibility({ isHypernativeEligible: true }))
      mockUseNestedTransaction.mockReturnValue({
        nestedSafeInfo,
        nestedSafeTx: nestedTx,
        isNested: true,
      })
      mockUseThreatAnalysisHypernative.mockReturnValue(buildThreatResult(Severity.OK))

      renderHook(() => useNestedThreatAnalysis(nestedTx, authToken))

      await waitFor(() => {
        expect(mockUseThreatAnalysisHypernative).toHaveBeenCalledWith(
          expect.objectContaining({
            safeAddress: NESTED_SAFE_ADDRESS,
            safeVersion: '1.4.1',
            data: nestedTx,
            authToken,
          }),
        )
      })
    })
  })

  describe('Error handling', () => {
    it('should return error from Blockaid analysis', async () => {
      const nestedTx = buildSafeTransaction('0x1234')
      const error = new Error('Blockaid API error')

      mockUseNestedTransaction.mockReturnValue({
        nestedSafeInfo: buildNestedSafeInfo(),
        nestedSafeTx: nestedTx,
        isNested: true,
      })
      mockUseThreatAnalysisUtils.mockReturnValue([undefined, error, false])

      const { result } = renderHook(() => useNestedThreatAnalysis(nestedTx))

      await waitFor(() => {
        const [, resultError] = result.current
        expect(resultError).toBe(error)
      })
    })

    it('should return error from Hypernative analysis', async () => {
      const nestedTx = buildSafeTransaction('0x1234')
      const authToken = 'test-auth-token'
      const error = new Error('Hypernative API error')

      mockUseIsHypernativeEligible.mockReturnValue(buildEligibility({ isHypernativeEligible: true }))
      mockUseNestedTransaction.mockReturnValue({
        nestedSafeInfo: buildNestedSafeInfo(),
        nestedSafeTx: nestedTx,
        isNested: true,
      })
      mockUseThreatAnalysisHypernative.mockReturnValue([undefined, error, false])

      const { result } = renderHook(() => useNestedThreatAnalysis(nestedTx, authToken))

      await waitFor(() => {
        const [, resultError] = result.current
        expect(resultError).toBe(error)
      })
    })
  })

  describe('Transaction source priority', () => {
    it('should use overrideSafeTx when provided', async () => {
      const overrideTx = buildSafeTransaction('0xoverride')

      mockUseNestedTransaction.mockReturnValue({
        nestedSafeInfo: buildNestedSafeInfo(),
        nestedSafeTx: overrideTx,
        isNested: true,
      })
      mockUseThreatAnalysisUtils.mockReturnValue(buildThreatResult(Severity.OK))

      renderHook(() => useNestedThreatAnalysis(overrideTx))

      await waitFor(() => {
        expect(mockUseNestedTransaction).toHaveBeenCalled()
        expect(mockUseThreatAnalysisUtils).toHaveBeenCalledWith(
          expect.objectContaining({
            data: overrideTx,
          }),
        )
      })
    })

    it('should pass correct props to analysis hooks', async () => {
      const nestedTx = buildSafeTransaction('0x1234')
      const authToken = 'test-auth-token'
      const nestedSafeInfo = buildNestedSafeInfo()

      mockUseNestedTransaction.mockReturnValue({
        nestedSafeInfo,
        nestedSafeTx: nestedTx,
        isNested: true,
      })
      mockUseThreatAnalysisUtils.mockReturnValue(buildThreatResult(Severity.OK))

      renderHook(() => useNestedThreatAnalysis(nestedTx, authToken))

      await waitFor(() => {
        expect(mockUseThreatAnalysisUtils).toHaveBeenCalledWith(
          expect.objectContaining({
            safeAddress: NESTED_SAFE_ADDRESS,
            chainId: '1',
            data: nestedTx,
            walletAddress: '0xWallet',
            origin: undefined,
            safeVersion: '1.4.1',
            skip: false,
          }),
        )
      })
    })
  })
})
