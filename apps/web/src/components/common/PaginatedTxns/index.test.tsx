import type { TransactionItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TX_HISTORY_SAFE, transactionFixtures } from '@safe-global/test/msw/fixtures'
import { http, HttpResponse } from 'msw'
import { GATEWAY_URL } from '@/config/gateway'
import { AppRoutes } from '@/config/routes'
import * as useChains from '@/hooks/useChains'
import useTxHistory from '@/hooks/useTxHistory'
import { chainBuilder } from '@/tests/builders/chains'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { server } from '@/tests/server'
import { act, render, screen, waitFor } from '@/tests/test-utils'
import { isTransactionListItem } from '@/utils/transaction-guards'
import PaginatedTxns from '.'

jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))

// Two short, disjoint slices of the recorded page keep the render well inside the test timeout
const { history: recordedHistory } = transactionFixtures
const history: TransactionItemPage = { ...recordedHistory, results: recordedHistory.results.slice(0, 8) }
const lastPage: TransactionItemPage = { ...recordedHistory, next: null, results: recordedHistory.results.slice(-6) }
const countTransactions = (page: TransactionItemPage) => page.results.filter(isTransactionListItem).length

const historySafe = extendedSafeInfoBuilder()
  .with({
    address: { value: TX_HISTORY_SAFE.address },
    chainId: TX_HISTORY_SAFE.chainId,
    version: TX_HISTORY_SAFE.version,
  })
  .build()

const sepolia = chainBuilder()
  .with({
    chainId: TX_HISTORY_SAFE.chainId,
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18, logoUri: '' },
  })
  .build()

// jsdom has no IntersectionObserver; this one shows the infinite scroll sentinel only when a test asks
const sentinelObservers: SentinelObserver[] = []
class SentinelObserver {
  constructor(readonly callback: IntersectionObserverCallback) {
    sentinelObservers.push(this)
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

const scrollToTheEnd = () =>
  act(() => {
    const observer = sentinelObservers.at(-1)
    observer?.callback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      observer as unknown as IntersectionObserver,
    )
  })

const renderHistory = () =>
  render(<PaginatedTxns useTxns={useTxHistory} />, {
    routerProps: {
      pathname: AppRoutes.transactions.history,
      query: { safe: `${TX_HISTORY_SAFE.shortName}:${TX_HISTORY_SAFE.address}` },
    },
    initialReduxState: {
      safeInfo: { data: historySafe, loading: false, loaded: true },
      txHistory: { data: history, loading: false, loaded: true },
    },
  })

describe('PaginatedTxns with the recorded staging history', () => {
  beforeEach(() => {
    sentinelObservers.length = 0
    Object.defineProperty(window, 'IntersectionObserver', { configurable: true, value: SentinelObserver })
    jest.spyOn(useChains, 'useCurrentChain').mockReturnValue(sepolia)
    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/transactions/history`, () =>
        HttpResponse.json(lastPage),
      ),
    )
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('shows a row for every transaction of a history page', async () => {
    renderHistory()

    expect(await screen.findAllByTestId('transaction-item')).toHaveLength(countTransactions(history))
  })

  it('keeps every row when the next page joins the list', async () => {
    renderHistory()
    await screen.findAllByTestId('transaction-item')

    scrollToTheEnd()

    const joinedRows = countTransactions(history) + countTransactions(lastPage)
    await waitFor(() => expect(screen.getAllByTestId('transaction-item')).toHaveLength(joinedRows))
  })
})
