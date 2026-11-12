import { faker } from '@faker-js/faker'
import { renderHook } from '@/tests/test-utils'
import type { PortfolioSummary } from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import { portfolioSummaryBuilder } from '@/tests/builders/portfolioSummary'
import { useSafePortfolioSummary } from '@/features/portfolio'
import useSafeTotalBalance from '../useSafeTotalBalance'

jest.mock('@/hooks/useVisibleBalances', () => ({
  useVisibleBalances: jest.fn(),
}))
jest.mock('@/features/portfolio', () => ({
  useSafePortfolioSummary: jest.fn(),
}))

const mockBalances = (fiatTotal: string, balances: string[]) =>
  jest.mocked(useVisibleBalances).mockReturnValue({
    balances: { fiatTotal, items: balances.map((balance) => ({ balance })) },
    loaded: true,
    loading: false,
    error: undefined,
  } as unknown as ReturnType<typeof useVisibleBalances>)

const mockSummary = (state: {
  isEnabled: boolean
  summary?: Pick<PortfolioSummary, 'fiatTotal'>
  isLoading?: boolean
}) =>
  jest.mocked(useSafePortfolioSummary).mockReturnValue({
    isEnabled: state.isEnabled,
    summary: state.summary && portfolioSummaryBuilder().with(state.summary).build(),
    isLoading: state.isLoading ?? false,
  })

const VISIBLE_TOTAL = faker.finance.amount()

describe('useSafeTotalBalance', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockBalances(VISIBLE_TOTAL, ['1'])
    mockSummary({ isEnabled: false })
  })

  it('keeps the balances when the flag is off', () => {
    const { result } = renderHook(() => useSafeTotalBalance())

    expect(result.current).toEqual({ fiatTotal: VISIBLE_TOTAL, noAssets: false, isSummaryEnabled: false })
  })

  it('reports no assets from the token balances when the flag is off', () => {
    mockBalances('0', ['0'])

    const { result } = renderHook(() => useSafeTotalBalance())

    expect(result.current.noAssets).toBe(true)
  })

  it('uses the summary total when the flag is on', () => {
    mockSummary({ isEnabled: true, summary: { fiatTotal: '650.25' } })

    const { result } = renderHook(() => useSafeTotalBalance())

    expect(result.current).toEqual({ fiatTotal: '650.25', noAssets: false, isSummaryEnabled: true })
  })

  it('does not report no assets for a Safe holding only DeFi positions', () => {
    mockBalances('0', ['0'])
    mockSummary({ isEnabled: true, summary: { fiatTotal: '354000' } })

    const { result } = renderHook(() => useSafeTotalBalance())

    expect(result.current.noAssets).toBe(false)
  })

  it('reports no assets when the summary total is zero', () => {
    mockSummary({ isEnabled: true, summary: { fiatTotal: '0' } })

    const { result } = renderHook(() => useSafeTotalBalance())

    expect(result.current.noAssets).toBe(true)
  })

  it('shows neither a total nor "Add funds" while the summary loads', () => {
    mockSummary({ isEnabled: true, isLoading: true })

    const { result } = renderHook(() => useSafeTotalBalance())

    expect(result.current).toEqual({ fiatTotal: undefined, noAssets: false, isSummaryEnabled: true })
  })

  it('falls back to the balances when the Safe is missing from the summaries', () => {
    mockSummary({ isEnabled: true })

    const { result } = renderHook(() => useSafeTotalBalance())

    expect(result.current).toEqual({ fiatTotal: VISIBLE_TOTAL, noAssets: false, isSummaryEnabled: true })
  })
})
