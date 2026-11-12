import { faker } from '@faker-js/faker'
import { advanceClock, renderHook } from '@/tests/test-utils'
import { refreshPortfolioSummary } from '@safe-global/store/gateway/portfolioSummaries'
import type { PortfolioSummary } from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'
import { FEATURES } from '@safe-global/utils/utils/chains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useChain } from '@/hooks/useChains'
import { chainBuilder } from '@/tests/builders/chains'
import { portfolioSnapshotBuilder, portfolioSummaryBuilder } from '@/tests/builders/portfolioSummary'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import usePortfolioSummaries from '../usePortfolioSummaries'
import useRefetchSummaryOnSettle, { SETTLE_REFETCH_DELAY_MS, SETTLE_WINDOW_MAX_MS } from '../useRefetchSummaryOnSettle'

jest.mock('@safe-global/store/gateway/portfolioSummaries', () => ({
  refreshPortfolioSummary: jest.fn(() => ({ type: 'test/refreshPortfolioSummary' })),
}))
jest.mock('@/hooks/useSafeInfo', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('@/hooks/useChains', () => ({ __esModule: true, default: jest.fn(), useChain: jest.fn() }))
jest.mock('../usePortfolioSummaries', () => ({ __esModule: true, default: jest.fn() }))

const SETTLE_EXPIRY_MS = 120_000
const REGULAR_EXPIRY_MS = 60 * 60_000

const mockSafe = () => {
  const chain = chainBuilder()
    .with({ features: [FEATURES.PORTFOLIO_SUMMARIES, FEATURES.PORTFOLIO_ENDPOINT, FEATURES.DEFAULT_TOKENLIST] })
    .build()
  const safe = extendedSafeInfoBuilder().with({ chainId: chain.chainId, deployed: true }).build()
  jest.mocked(useChain).mockReturnValue(chain)
  jest.mocked(useSafeInfo).mockReturnValue({
    safe,
    safeAddress: safe.address.value,
    safeLoaded: true,
    safeLoading: false,
    safeError: undefined,
  })
  return { chainId: chain.chainId, address: safe.address.value }
}

const mockSummary = ({ enabled, summary }: { enabled: boolean; summary?: PortfolioSummary }) =>
  jest.mocked(usePortfolioSummaries).mockReturnValue({
    isEnabled: () => enabled,
    getSummary: () => summary,
    isLoading: false,
  })

const summaryExpiringIn = (ms: number) =>
  portfolioSummaryBuilder()
    .with({
      snapshot: portfolioSnapshotBuilder()
        .with({ expiresAt: new Date(Date.now() + ms).toISOString() })
        .build(),
    })
    .build()

describe('useRefetchSummaryOnSettle', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('refetches the current Safe summary once, when a post-tx snapshot expires', async () => {
    const { chainId, address } = mockSafe()
    mockSummary({ enabled: true, summary: summaryExpiringIn(SETTLE_EXPIRY_MS) })
    renderHook(() => useRefetchSummaryOnSettle())

    await advanceClock(SETTLE_EXPIRY_MS)
    expect(refreshPortfolioSummary).not.toHaveBeenCalled()
    await advanceClock(SETTLE_REFETCH_DELAY_MS + SETTLE_WINDOW_MAX_MS)

    expect(refreshPortfolioSummary).toHaveBeenCalledTimes(1)
    expect(refreshPortfolioSummary).toHaveBeenCalledWith({
      safes: [`${chainId}:${address}`],
      currency: 'usd',
      trusted: true,
    })
  })

  it('does not refetch a snapshot with a regular lifetime', async () => {
    mockSafe()
    mockSummary({ enabled: true, summary: summaryExpiringIn(REGULAR_EXPIRY_MS) })
    renderHook(() => useRefetchSummaryOnSettle())

    await advanceClock(REGULAR_EXPIRY_MS + SETTLE_REFETCH_DELAY_MS)

    expect(refreshPortfolioSummary).not.toHaveBeenCalled()
  })

  it('does not refetch a Transaction Service summary, which has no snapshot', async () => {
    mockSafe()
    mockSummary({ enabled: true, summary: portfolioSummaryBuilder().with({ source: 'tx_service' }).build() })
    renderHook(() => useRefetchSummaryOnSettle())

    await advanceClock(SETTLE_WINDOW_MAX_MS + SETTLE_REFETCH_DELAY_MS)

    expect(refreshPortfolioSummary).not.toHaveBeenCalled()
  })

  it('does not refetch after unmount', async () => {
    mockSafe()
    mockSummary({ enabled: true, summary: summaryExpiringIn(SETTLE_EXPIRY_MS) })
    const { unmount } = renderHook(() => useRefetchSummaryOnSettle())

    unmount()
    await advanceClock(SETTLE_EXPIRY_MS + SETTLE_REFETCH_DELAY_MS)

    expect(refreshPortfolioSummary).not.toHaveBeenCalled()
  })

  it('does not refetch the previous Safe after switching Safe', async () => {
    mockSafe()
    mockSummary({ enabled: true, summary: summaryExpiringIn(SETTLE_EXPIRY_MS) })
    const { rerender } = renderHook(() => useRefetchSummaryOnSettle())

    mockSafe()
    mockSummary({ enabled: true, summary: summaryExpiringIn(REGULAR_EXPIRY_MS) })
    rerender()
    await advanceClock(SETTLE_EXPIRY_MS + SETTLE_REFETCH_DELAY_MS)

    expect(refreshPortfolioSummary).not.toHaveBeenCalled()
  })

  it('does nothing when the chain has the flag off', async () => {
    mockSafe()
    mockSummary({ enabled: false, summary: summaryExpiringIn(faker.number.int({ min: 1_000, max: SETTLE_EXPIRY_MS })) })
    renderHook(() => useRefetchSummaryOnSettle())

    await advanceClock(SETTLE_WINDOW_MAX_MS + SETTLE_REFETCH_DELAY_MS)

    expect(refreshPortfolioSummary).not.toHaveBeenCalled()
  })
})
