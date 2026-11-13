import { faker } from '@faker-js/faker'
import { renderHook } from '@/tests/test-utils'
import { useRefetchBalances } from '@/hooks/useRefetchBalances'
import useSafeInfo from '@/hooks/useSafeInfo'
import { PORTFOLIO_CACHE_TIME_MS } from '@/config/constants'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import usePortfolioRefetchOnTxHistory from '../usePortfolioRefetchOnTxHistory'

jest.mock('@/hooks/useRefetchBalances', () => ({ useRefetchBalances: jest.fn() }))
jest.mock('@/hooks/useSafeInfo', () => ({ __esModule: true, default: jest.fn() }))

const refetch = jest.fn()
const refetchSummary = jest.fn()

const mockRefetchBalances = (shouldUsePortfolioEndpoint: boolean) =>
  jest.mocked(useRefetchBalances).mockReturnValue({
    refetch,
    refetchPositions: jest.fn(),
    refetchSummary,
    shouldUsePortfolioEndpoint,
    fulfilledTimeStamp: Date.now() - PORTFOLIO_CACHE_TIME_MS,
    isFetching: false,
  })

const renderWithTxHistoryTag = () => {
  const safe = extendedSafeInfoBuilder().build()
  const safeInfoWith = (txHistoryTag: string) => ({
    safe: { ...safe, txHistoryTag },
    safeAddress: safe.address.value,
    safeLoaded: true,
    safeLoading: false,
    safeError: undefined,
  })
  jest.mocked(useSafeInfo).mockReturnValue(safeInfoWith(faker.string.numeric(10)))
  const { rerender } = renderHook(() => usePortfolioRefetchOnTxHistory())
  return () => {
    jest.mocked(useSafeInfo).mockReturnValue(safeInfoWith(faker.string.numeric(10)))
    rerender()
  }
}

describe('usePortfolioRefetchOnTxHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('refetches nothing on mount', () => {
    mockRefetchBalances(true)

    renderWithTxHistoryTag()

    expect(refetch).not.toHaveBeenCalled()
    expect(refetchSummary).not.toHaveBeenCalled()
  })

  it('refetches the portfolio, which refetches the summary, when the tx history changes', () => {
    mockRefetchBalances(true)
    const changeTxHistory = renderWithTxHistoryTag()

    changeTxHistory()

    expect(refetch).toHaveBeenCalledTimes(1)
    expect(refetchSummary).not.toHaveBeenCalled()
  })

  it('refetches the summary when the tx history changes on a chain without the portfolio endpoint', () => {
    mockRefetchBalances(false)
    const changeTxHistory = renderWithTxHistoryTag()

    changeTxHistory()

    expect(refetchSummary).toHaveBeenCalledTimes(1)
    expect(refetch).not.toHaveBeenCalled()
  })
})
