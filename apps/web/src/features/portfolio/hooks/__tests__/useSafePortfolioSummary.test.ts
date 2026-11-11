import { renderHook } from '@/tests/test-utils'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { PortfolioSummary } from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'
import useSafeInfo from '@/hooks/useSafeInfo'
import usePortfolioSummaries from '../usePortfolioSummaries'
import useSafePortfolioSummary from '../useSafePortfolioSummary'

jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: jest.fn(),
}))
jest.mock('../usePortfolioSummaries', () => ({
  __esModule: true,
  default: jest.fn(),
}))

const SAFE = '0x1111111111111111111111111111111111111111'
const SUMMARY: PortfolioSummary = { chainId: '1', address: SAFE, fiatTotal: '42', source: 'zerion', snapshot: null }

const mockSafe = (deployed: boolean) =>
  jest.mocked(useSafeInfo).mockReturnValue({
    safe: { chainId: '1', deployed },
    safeAddress: SAFE,
  } as unknown as ReturnType<typeof useSafeInfo>)

const mockSummaries = (enabled: boolean, isLoading = false) =>
  jest.mocked(usePortfolioSummaries).mockReturnValue({
    isEnabled: () => enabled,
    getSummary: () => SUMMARY,
    isLoading,
  })

describe('useSafePortfolioSummary', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSafe(true)
    mockSummaries(true)
  })

  it('requests the current Safe on the current chain for the given flag', () => {
    renderHook(() => useSafePortfolioSummary(FEATURES.PORTFOLIO_SUMMARIES_HOME))

    expect(usePortfolioSummaries).toHaveBeenCalledWith(
      [{ chainId: '1', address: SAFE }],
      FEATURES.PORTFOLIO_SUMMARIES_HOME,
    )
  })

  it('returns the summary when the chain has the flag', () => {
    const { result } = renderHook(() => useSafePortfolioSummary(FEATURES.PORTFOLIO_SUMMARIES_HOME))

    expect(result.current).toEqual({ isEnabled: true, summary: SUMMARY, isLoading: false })
  })

  it('returns nothing when the chain has the flag off', () => {
    mockSummaries(false, true)

    const { result } = renderHook(() => useSafePortfolioSummary(FEATURES.PORTFOLIO_SUMMARIES_HOME))

    expect(result.current).toEqual({ isEnabled: false, summary: undefined, isLoading: false })
  })

  it('skips counterfactual Safes', () => {
    mockSafe(false)

    const { result } = renderHook(() => useSafePortfolioSummary(FEATURES.PORTFOLIO_SUMMARIES_HOME))

    expect(usePortfolioSummaries).toHaveBeenCalledWith([], FEATURES.PORTFOLIO_SUMMARIES_HOME)
    expect(result.current.isEnabled).toBe(false)
  })
})
