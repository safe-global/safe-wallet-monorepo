import { renderHook, fakerChecksummedAddress } from '@/tests/test-utils'
import { portfolioSummaryBuilder } from '@/tests/builders/portfolioSummary'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
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

const SAFE = fakerChecksummedAddress()
const SUMMARY = portfolioSummaryBuilder().with({ chainId: '1', address: SAFE }).build()

const mockSafe = (deployed: boolean) =>
  jest.mocked(useSafeInfo).mockReturnValue({
    safe: extendedSafeInfoBuilder()
      .with({ chainId: '1', deployed, address: { value: SAFE } })
      .build(),
    safeAddress: SAFE,
    safeLoaded: true,
    safeLoading: false,
    safeError: undefined,
  })

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

  it('requests the current Safe on the current chain', () => {
    renderHook(() => useSafePortfolioSummary())

    expect(usePortfolioSummaries).toHaveBeenCalledWith([{ chainId: '1', address: SAFE }])
  })

  it('returns the summary when the chain has the flag', () => {
    const { result } = renderHook(() => useSafePortfolioSummary())

    expect(result.current).toEqual({ isEnabled: true, summary: SUMMARY, isLoading: false })
  })

  it('returns nothing when the chain has the flag off', () => {
    mockSummaries(false, true)

    const { result } = renderHook(() => useSafePortfolioSummary())

    expect(result.current).toEqual({ isEnabled: false, summary: undefined, isLoading: false })
  })

  it('skips counterfactual Safes', () => {
    mockSafe(false)

    const { result } = renderHook(() => useSafePortfolioSummary())

    expect(usePortfolioSummaries).toHaveBeenCalledWith([])
    expect(result.current.isEnabled).toBe(false)
  })
})
