import { faker } from '@faker-js/faker'
import { renderHook } from '@/tests/test-utils'
import type { PortfolioSummary } from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import { balanceBuilder } from '@/tests/builders/balances'
import { portfolioSummaryBuilder } from '@/tests/builders/portfolioSummary'
import { useSafePortfolioSummary } from '@/features/portfolio'
import useSafeTotalBalance from '../useSafeTotalBalance'

jest.mock('@/hooks/useVisibleBalances', () => ({
  useVisibleBalances: jest.fn(),
}))
jest.mock('@/features/portfolio', () => ({
  useSafePortfolioSummary: jest.fn(),
}))

const VISIBLE_TOTAL = faker.finance.amount()
const HELD = balanceBuilder().build()
const EMPTY = balanceBuilder().with({ balance: '0' }).build()

const mockBalances = (fiatTotal: string, items = [HELD], loaded = true) =>
  jest.mocked(useVisibleBalances).mockReturnValue({
    balances: { fiatTotal, items },
    loaded,
    loading: !loaded,
    error: undefined,
  })

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

describe('useSafeTotalBalance', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockBalances(VISIBLE_TOTAL)
    mockSummary({ isEnabled: false })
  })

  it('keeps the balances when the flag is off', () => {
    const { result } = renderHook(() => useSafeTotalBalance())

    expect(result.current).toEqual({ fiatTotal: VISIBLE_TOTAL, noAssets: false, isSummaryEnabled: false })
  })

  it('reports no assets from the token balances when the flag is off', () => {
    mockBalances('0', [EMPTY])

    const { result } = renderHook(() => useSafeTotalBalance())

    expect(result.current.noAssets).toBe(true)
  })

  it('uses the summary total when the flag is on', () => {
    const fiatTotal = faker.finance.amount({ min: 1 })
    mockSummary({ isEnabled: true, summary: { fiatTotal } })

    const { result } = renderHook(() => useSafeTotalBalance())

    expect(result.current).toEqual({ fiatTotal, noAssets: false, isSummaryEnabled: true })
  })

  it('does not report no assets for a Safe holding only DeFi positions', () => {
    mockBalances('0', [EMPTY])
    mockSummary({ isEnabled: true, summary: { fiatTotal: faker.finance.amount({ min: 1 }) } })

    const { result } = renderHook(() => useSafeTotalBalance())

    expect(result.current.noAssets).toBe(false)
  })

  it('does not report no assets for a Safe holding tokens the summary values at zero', () => {
    mockBalances('0', [HELD])
    mockSummary({ isEnabled: true, summary: { fiatTotal: '0' } })

    const { result } = renderHook(() => useSafeTotalBalance())

    expect(result.current.noAssets).toBe(false)
  })

  it('reports no assets when the summary total is zero and the Safe holds no tokens', () => {
    mockBalances('0', [EMPTY])
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

  it('shows no total, not $0, while it falls back to balances that are still loading', () => {
    mockBalances('', [], false)
    mockSummary({ isEnabled: true })

    const { result } = renderHook(() => useSafeTotalBalance())

    expect(result.current).toEqual({ fiatTotal: undefined, noAssets: false, isSummaryEnabled: true })
  })
})
