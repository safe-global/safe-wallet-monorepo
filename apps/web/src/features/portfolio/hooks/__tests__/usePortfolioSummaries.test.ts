import { renderHook } from '@/tests/test-utils'
import { skipToken } from '@reduxjs/toolkit/query'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { usePortfolioGetSummariesForManyQuery } from '@safe-global/store/gateway/portfolioSummaries'
import type { PortfolioSummary } from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'
import { chainBuilder } from '@/tests/builders/chains'
import useChains from '@/hooks/useChains'
import usePortfolioSummaries, { PORTFOLIO_SUMMARIES_POLLING_INTERVAL } from '../usePortfolioSummaries'

jest.mock('@safe-global/store/gateway/portfolioSummaries', () => ({
  usePortfolioGetSummariesForManyQuery: jest.fn(),
}))
jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: jest.fn(),
}))

const mockQuery = usePortfolioGetSummariesForManyQuery as jest.Mock
const mockUseChains = useChains as jest.Mock

const SAFE = '0x1111111111111111111111111111111111111111'
const OTHER_SAFE = '0x2222222222222222222222222222222222222222'

const summary = (chainId: string, address: string, fiatTotal: string): PortfolioSummary => ({
  chainId,
  address,
  fiatTotal,
  source: 'zerion',
  snapshot: null,
})

describe('usePortfolioSummaries', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseChains.mockReturnValue({
      configs: [
        chainBuilder()
          .with({ chainId: '1', features: [FEATURES.PORTFOLIO_SUMMARIES_SELECTOR] })
          .build(),
        chainBuilder().with({ chainId: '137', features: [] }).build(),
      ],
    })
    mockQuery.mockReturnValue({ data: undefined, isLoading: false })
  })

  it('requests only the Safes whose chain has the flag, polling every 60s while focused', () => {
    renderHook(() =>
      usePortfolioSummaries(
        [
          { chainId: '137', address: SAFE },
          { chainId: '1', address: OTHER_SAFE },
          { chainId: '1', address: SAFE },
        ],
        FEATURES.PORTFOLIO_SUMMARIES_SELECTOR,
      ),
    )

    expect(mockQuery).toHaveBeenCalledWith(
      { safes: [`1:${SAFE}`, `1:${OTHER_SAFE}`], currency: expect.any(String) },
      { pollingInterval: PORTFOLIO_SUMMARIES_POLLING_INTERVAL, skipPollingIfUnfocused: true },
    )
  })

  it('skips the request when no chain has the flag', () => {
    renderHook(() => usePortfolioSummaries([{ chainId: '137', address: SAFE }], FEATURES.PORTFOLIO_SUMMARIES_SELECTOR))

    expect(mockQuery).toHaveBeenCalledWith(skipToken, expect.anything())
  })

  it('reports which chains have the flag', () => {
    const { result } = renderHook(() => usePortfolioSummaries([], FEATURES.PORTFOLIO_SUMMARIES_SELECTOR))

    expect(result.current.isEnabled('1')).toBe(true)
    expect(result.current.isEnabled('137')).toBe(false)
  })

  it('finds a summary by chain and address, ignoring address case', () => {
    mockQuery.mockReturnValue({ data: [summary('1', SAFE, '42')], isLoading: false })

    const { result } = renderHook(() =>
      usePortfolioSummaries([{ chainId: '1', address: SAFE }], FEATURES.PORTFOLIO_SUMMARIES_SELECTOR),
    )

    expect(result.current.getSummary('1', SAFE.toUpperCase().replace('0X', '0x'))?.fiatTotal).toBe('42')
    expect(result.current.getSummary('137', SAFE)).toBeUndefined()
  })
})
