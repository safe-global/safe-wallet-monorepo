import { renderHook } from '@testing-library/react'
import useSafeScanContext from '../useSafeScanContext'
import type { SelectedSafe, SpaceSafeEntry } from '@/features/spaces/components/SecurityHub'

// ── mocks ──────────────────────────────────────────────────────────────

const SAFE_ADDRESS = '0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6'
const CHAIN_ID = '1'

const mockSafeInfo = {
  owners: [{ value: '0x1111111111111111111111111111111111111111' }],
  threshold: 1,
  modules: null,
  guard: null,
  fallbackHandler: { value: '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4' },
  implementationVersionState: 'UP_TO_DATE' as const,
  implementation: { value: '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552' },
  version: '1.4.1',
  nonce: 5,
}

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/safes', () => ({
  useSafesGetSafeV1Query: jest.fn(),
}))
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/chains', () => ({
  useChainsGetMasterCopiesV1Query: jest.fn(),
}))
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/transactions', () => ({
  useTransactionsGetCreationTransactionV1Query: jest.fn(),
}))
jest.mock('@/store/api/gateway', () => ({
  useGetSafeOverviewQuery: jest.fn(),
  useGetMultipleSafeOverviewsQuery: jest.fn(),
}))
jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: jest.fn(),
  useChain: jest.fn(),
}))
jest.mock('@/store', () => ({ useAppSelector: jest.fn() }))
jest.mock('@/store/slices', () => ({ selectCurrency: jest.fn(), selectUndeployedSafes: jest.fn() }))
jest.mock('@/features/multichain/utils', () => ({
  getSafeSetups: jest.fn(),
  getSharedSetup: jest.fn(),
  getDeviatingSetups: jest.fn(),
}))
jest.mock('@safe-global/utils/utils/chains', () => ({
  getLatestSafeVersion: jest.fn(() => '1.4.1'),
  isNonCriticalUpdate: jest.fn(() => false),
  hasFeature: jest.fn(() => false),
  FEATURES: { RECOVERY: 'RECOVERY', HYPERNATIVE: 'HYPERNATIVE', RISK_MITIGATION: 'RISK_MITIGATION' },
}))

import { useSafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { useChainsGetMasterCopiesV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { useTransactionsGetCreationTransactionV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useGetSafeOverviewQuery, useGetMultipleSafeOverviewsQuery } from '@/store/api/gateway'
import { useChain } from '@/hooks/useChains'
import useChains from '@/hooks/useChains'
import { useAppSelector } from '@/store'

const defaultSelected: SelectedSafe = { address: SAFE_ADDRESS, chainId: CHAIN_ID }
const defaultEntry: SpaceSafeEntry = {
  address: SAFE_ADDRESS,
  chainId: CHAIN_ID,
  name: 'Test Safe',
  isMultichain: false,
  chainEntries: [{ chainId: CHAIN_ID, isDeployed: true }],
}

function setupDefaults() {
  ;(useSafesGetSafeV1Query as jest.Mock).mockReturnValue({
    currentData: mockSafeInfo,
    isFetching: false,
  })
  ;(useChainsGetMasterCopiesV1Query as jest.Mock).mockReturnValue({
    currentData: [],
    isFetching: false,
    isError: false,
  })
  // Default creation tx to "errored" so the gate accepts a null creationInfo.
  // Tests that want creation data populated override `currentData` explicitly.
  ;(useTransactionsGetCreationTransactionV1Query as jest.Mock).mockReturnValue({
    currentData: undefined,
    isFetching: false,
    isError: true,
  })
  ;(useGetSafeOverviewQuery as jest.Mock).mockReturnValue({
    currentData: { fiatTotal: '1000', queued: 2 },
    isFetching: false,
  })
  ;(useGetMultipleSafeOverviewsQuery as jest.Mock).mockReturnValue({ currentData: undefined, isFetching: false })
  ;(useChain as jest.Mock).mockReturnValue({ chainId: CHAIN_ID, features: [] })
  ;(useChains as jest.Mock).mockReturnValue({ configs: [] })
  ;(useAppSelector as jest.Mock).mockReturnValue({})
}

// ── tests ──────────────────────────────────────────────────────────────

describe('useSafeScanContext', () => {
  beforeEach(() => {
    setupDefaults()
  })

  it('returns a valid ScanContext when all data is available', () => {
    const { result } = renderHook(() => useSafeScanContext(defaultSelected, defaultEntry))
    expect(result.current).not.toBeNull()
    expect(result.current?.chainId).toBe(CHAIN_ID)
    expect(result.current?.safeAddress).toBe(SAFE_ADDRESS)
    expect(result.current?.threshold).toBe(1)
    expect(result.current?.version).toBe('1.4.1')
  })

  it('returns null when selected is null', () => {
    const { result } = renderHook(() => useSafeScanContext(null, defaultEntry))
    expect(result.current).toBeNull()
  })

  it('returns null when entry is undefined', () => {
    const { result } = renderHook(() => useSafeScanContext(defaultSelected, undefined))
    expect(result.current).toBeNull()
  })

  it('returns null when Safe data is still loading', () => {
    ;(useSafesGetSafeV1Query as jest.Mock).mockReturnValue({
      currentData: undefined,
      isFetching: true,
    })
    const { result } = renderHook(() => useSafeScanContext(defaultSelected, defaultEntry))
    expect(result.current).toBeNull()
  })

  it('returns null for undeployed Safe', () => {
    const undeployedEntry: SpaceSafeEntry = {
      ...defaultEntry,
      chainEntries: [{ chainId: CHAIN_ID, isDeployed: false }],
    }
    // useSafesGetSafeV1Query will skip and return no data
    ;(useSafesGetSafeV1Query as jest.Mock).mockReturnValue({
      currentData: undefined,
      isFetching: false,
    })
    const { result } = renderHook(() => useSafeScanContext(defaultSelected, undeployedEntry))
    expect(result.current).toBeNull()
  })

  it('includes correct balanceUsd from safeOverview.fiatTotal', () => {
    ;(useGetSafeOverviewQuery as jest.Mock).mockReturnValue({
      currentData: { fiatTotal: '50000.5', queued: 0 },
      isFetching: false,
    })
    const { result } = renderHook(() => useSafeScanContext(defaultSelected, defaultEntry))
    expect(result.current?.balanceUsd).toBe(50000.5)
  })

  it('includes correct queuedTxCount from safeOverview.queued', () => {
    ;(useGetSafeOverviewQuery as jest.Mock).mockReturnValue({
      currentData: { fiatTotal: '0', queued: 7 },
      isFetching: false,
    })
    const { result } = renderHook(() => useSafeScanContext(defaultSelected, defaultEntry))
    expect(result.current?.queuedTxCount).toBe(7)
  })

  it('sets isMultichain based on entry having multiple chain entries', () => {
    const multichainEntry: SpaceSafeEntry = {
      ...defaultEntry,
      isMultichain: true,
      chainEntries: [
        { chainId: '1', isDeployed: true },
        { chainId: '137', isDeployed: true },
      ],
    }
    // Multichain path also requires safeOverviews to settle so signer-integrity can
    // compare setups across chains. Provide a settled (but empty) response so the
    // gate proceeds.
    ;(useGetMultipleSafeOverviewsQuery as jest.Mock).mockReturnValue({
      currentData: [],
      isFetching: false,
    })
    const { result } = renderHook(() => useSafeScanContext(defaultSelected, multichainEntry))
    expect(result.current?.isMultichain).toBe(true)
  })

  it('handles creation info when available', () => {
    ;(useTransactionsGetCreationTransactionV1Query as jest.Mock).mockReturnValue({
      currentData: {
        factoryAddress: '0xFactory',
        creator: '0xCreator',
        masterCopy: '0xMasterCopy',
        transactionHash: '0xTxHash',
      },
    })
    const { result } = renderHook(() => useSafeScanContext(defaultSelected, defaultEntry))
    expect(result.current?.creationInfo).toEqual({
      factoryAddress: '0xFactory',
      creator: '0xCreator',
      masterCopy: '0xMasterCopy',
      transactionHash: '0xTxHash',
    })
  })

  it('sets creationInfo to null when no creation data', () => {
    const { result } = renderHook(() => useSafeScanContext(defaultSelected, defaultEntry))
    expect(result.current?.creationInfo).toBeNull()
  })

  it('uses overviewData when provided instead of querying the API', () => {
    // Override the query mock to return different values — these should be ignored
    ;(useGetSafeOverviewQuery as jest.Mock).mockReturnValue({
      currentData: { fiatTotal: '999999', queued: 99 },
      isFetching: false,
    })
    const overviewData = { balanceUsd: 42000, queuedTxCount: 3 }
    const { result } = renderHook(() => useSafeScanContext(defaultSelected, defaultEntry, overviewData))
    expect(result.current?.balanceUsd).toBe(42000)
    expect(result.current?.queuedTxCount).toBe(3)
  })

  it('waits for the creation transaction query to settle before building context', () => {
    // RTK Query can report isLoading=false while currentData is still undefined
    // (uninitialized → pending transition window). The OLD gate trusted isLoading
    // alone and would let the scan run with creationInfo=null, producing the
    // misleading "creation data not yet available" result that flips on rescan.
    // The new gate also requires either data presence or a definitive error.
    ;(useTransactionsGetCreationTransactionV1Query as jest.Mock).mockReturnValue({
      currentData: undefined,
      isFetching: false,
      isError: false,
    })
    const { result } = renderHook(() => useSafeScanContext(defaultSelected, defaultEntry))
    expect(result.current).toBeNull()
  })

  it('accepts a null creationInfo when the creation transaction query has errored', () => {
    // If the gateway definitively cannot provide the creation tx (404/error), we
    // proceed and let the scanner emit `inconclusive`. Otherwise users would be
    // stuck in a permanent "loading" state for Safes whose creation isn't indexed.
    ;(useTransactionsGetCreationTransactionV1Query as jest.Mock).mockReturnValue({
      currentData: undefined,
      isFetching: false,
      isError: true,
    })
    const { result } = renderHook(() => useSafeScanContext(defaultSelected, defaultEntry))
    expect(result.current).not.toBeNull()
    expect(result.current?.creationInfo).toBeNull()
  })

  it('skips overview loading guard when overviewData is provided', () => {
    // Simulate the overview query still loading — should NOT block context creation
    ;(useGetSafeOverviewQuery as jest.Mock).mockReturnValue({
      currentData: undefined,
      isFetching: true,
    })
    const overviewData = { balanceUsd: 500, queuedTxCount: 1 }
    const { result } = renderHook(() => useSafeScanContext(defaultSelected, defaultEntry, overviewData))
    expect(result.current).not.toBeNull()
    expect(result.current?.balanceUsd).toBe(500)
  })
})
