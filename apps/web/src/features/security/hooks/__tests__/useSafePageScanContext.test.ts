import { renderHook } from '@testing-library/react'
import useSafePageScanContext from '../useSafePageScanContext'

// ── mocks ──────────────────────────────────────────────────────────────

const SAFE_ADDRESS = '0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6'
const CHAIN_ID = '1'

const mockSafeInfo = {
  safe: {
    address: { value: SAFE_ADDRESS },
    chainId: CHAIN_ID,
    owners: [{ value: '0x1111111111111111111111111111111111111111' }],
    threshold: 1,
    modules: null,
    guard: null,
    fallbackHandler: { value: '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4' },
    implementationVersionState: 'UP_TO_DATE',
    implementation: { value: '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552' },
    version: '1.4.1',
    nonce: 5,
  },
  safeAddress: SAFE_ADDRESS,
  safeLoaded: true,
  safeLoading: false,
  safeError: undefined,
}

jest.mock('@/hooks/useSafeInfo', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('@/hooks/useSafeAddressFromUrl', () => ({ useSafeAddressFromUrl: jest.fn() }))
jest.mock('@/hooks/useChainId', () => ({ useUrlChainId: jest.fn() }))
jest.mock('@/hooks/useMasterCopies', () => ({ useMasterCopies: jest.fn() }))
jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: jest.fn(),
  useCurrentChain: jest.fn(),
}))
jest.mock('@/hooks/safes', () => ({ useAllSafesGrouped: jest.fn() }))
jest.mock('@/store/api/gateway', () => ({
  useGetSafeOverviewQuery: jest.fn(),
  useGetMultipleSafeOverviewsQuery: jest.fn(),
}))
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/transactions', () => ({
  useTransactionsGetCreationTransactionV1Query: jest.fn(),
}))
jest.mock('@/store', () => ({ useAppSelector: jest.fn() }))
jest.mock('@/store/slices', () => ({ selectCurrency: jest.fn(), selectUndeployedSafes: jest.fn() }))
jest.mock('@/features/multichain/hooks/useIsMultichainSafe', () => ({ useIsMultichainSafe: jest.fn() }))
jest.mock('@/features/multichain/utils', () => ({
  getSafeSetups: jest.fn(),
  getSharedSetup: jest.fn(),
  getDeviatingSetups: jest.fn(),
}))
jest.mock('@safe-global/utils/utils/chains', () => ({
  getLatestSafeVersion: jest.fn(() => '1.4.1'),
  isNonCriticalUpdate: jest.fn(() => false),
  hasFeature: jest.fn(() => false),
  FEATURES: { RECOVERY: 'RECOVERY', HYPERNATIVE: 'HYPERNATIVE' },
}))

import useSafeInfo from '@/hooks/useSafeInfo'
import { useSafeAddressFromUrl } from '@/hooks/useSafeAddressFromUrl'
import { useUrlChainId } from '@/hooks/useChainId'
import { useMasterCopies } from '@/hooks/useMasterCopies'
import { useCurrentChain } from '@/hooks/useChains'
import useChains from '@/hooks/useChains'
import { useAllSafesGrouped } from '@/hooks/safes'
import { useGetSafeOverviewQuery, useGetMultipleSafeOverviewsQuery } from '@/store/api/gateway'
import { useAppSelector } from '@/store'
import { useIsMultichainSafe } from '@/features/multichain/hooks/useIsMultichainSafe'
import { useTransactionsGetCreationTransactionV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

function setupDefaults(overrides: Partial<typeof mockSafeInfo> = {}) {
  const info = { ...mockSafeInfo, ...overrides }
  ;(useSafeInfo as jest.Mock).mockReturnValue(info)
  ;(useSafeAddressFromUrl as jest.Mock).mockReturnValue(info.safeAddress)
  ;(useUrlChainId as jest.Mock).mockReturnValue(info.safe.chainId)
  ;(useMasterCopies as jest.Mock).mockReturnValue([[], false])
  ;(useCurrentChain as jest.Mock).mockReturnValue({ chainId: CHAIN_ID, features: [] })
  ;(useChains as jest.Mock).mockReturnValue({ configs: [] })
  ;(useAllSafesGrouped as jest.Mock).mockReturnValue({ allMultiChainSafes: [] })
  ;(useGetSafeOverviewQuery as jest.Mock).mockReturnValue({
    currentData: { fiatTotal: '1000', queued: 3 },
  })
  ;(useGetMultipleSafeOverviewsQuery as jest.Mock).mockReturnValue({ currentData: undefined })
  ;(useAppSelector as jest.Mock).mockReturnValue({})
  ;(useIsMultichainSafe as jest.Mock).mockReturnValue(false)
  ;(useTransactionsGetCreationTransactionV1Query as jest.Mock).mockReturnValue({ currentData: undefined })
}

// ── tests ──────────────────────────────────────────────────────────────

describe('useSafePageScanContext', () => {
  beforeEach(() => {
    setupDefaults()
  })

  it('returns a valid ScanContext when all data is in sync', () => {
    const { result } = renderHook(() => useSafePageScanContext())
    expect(result.current).not.toBeNull()
    expect(result.current?.chainId).toBe(CHAIN_ID)
    expect(result.current?.safeAddress).toBe(SAFE_ADDRESS)
  })

  it('returns null when safeLoaded is false', () => {
    setupDefaults({ safeLoaded: false })
    const { result } = renderHook(() => useSafePageScanContext())
    expect(result.current).toBeNull()
  })

  it('returns null when safeLoading is true', () => {
    setupDefaults({ safeLoading: true })
    const { result } = renderHook(() => useSafePageScanContext())
    expect(result.current).toBeNull()
  })

  it('returns null when URL address does not match useSafeInfo address', () => {
    setupDefaults()
    ;(useSafeAddressFromUrl as jest.Mock).mockReturnValue('0xDifferentAddress')
    const { result } = renderHook(() => useSafePageScanContext())
    expect(result.current).toBeNull()
  })

  it('returns null when URL chainId does not match useSafeInfo chainId', () => {
    setupDefaults()
    ;(useUrlChainId as jest.Mock).mockReturnValue('137')
    const { result } = renderHook(() => useSafePageScanContext())
    expect(result.current).toBeNull()
  })

  it('returns null when safeOverview has not loaded', () => {
    setupDefaults()
    ;(useGetSafeOverviewQuery as jest.Mock).mockReturnValue({ currentData: undefined })
    const { result } = renderHook(() => useSafePageScanContext())
    expect(result.current).toBeNull()
  })

  it('includes correct balanceUsd from safeOverview.fiatTotal', () => {
    setupDefaults()
    ;(useGetSafeOverviewQuery as jest.Mock).mockReturnValue({
      currentData: { fiatTotal: '50000.5', queued: 0 },
    })
    const { result } = renderHook(() => useSafePageScanContext())
    expect(result.current?.balanceUsd).toBe(50000.5)
  })

  it('includes correct queuedTxCount from safeOverview.queued', () => {
    setupDefaults()
    ;(useGetSafeOverviewQuery as jest.Mock).mockReturnValue({
      currentData: { fiatTotal: '0', queued: 7 },
    })
    const { result } = renderHook(() => useSafePageScanContext())
    expect(result.current?.queuedTxCount).toBe(7)
  })

  it('returns null when multichain overviews have not loaded', () => {
    setupDefaults()
    ;(useIsMultichainSafe as jest.Mock).mockReturnValue(true)
    ;(useAllSafesGrouped as jest.Mock).mockReturnValue({
      allMultiChainSafes: [
        {
          address: SAFE_ADDRESS,
          safes: [
            { chainId: '1', address: SAFE_ADDRESS },
            { chainId: '137', address: SAFE_ADDRESS },
          ],
        },
      ],
    })
    ;(useGetMultipleSafeOverviewsQuery as jest.Mock).mockReturnValue({ currentData: undefined })

    const { result } = renderHook(() => useSafePageScanContext())
    expect(result.current).toBeNull()
  })
})
