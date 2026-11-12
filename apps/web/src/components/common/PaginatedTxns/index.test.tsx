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
import { act, fireEvent, render, screen, waitFor } from '@/tests/test-utils'
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

const OUTGOING_TRANSFERS_URL = `${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/outgoing-transfers`
const SECOND_PAGE_CURSOR = 'limit=20&offset=20'
const secondPageUrl = `${GATEWAY_URL}/v1/chains/${TX_HISTORY_SAFE.chainId}/safes/${TX_HISTORY_SAFE.address}/outgoing-transfers?cursor=${encodeURIComponent(SECOND_PAGE_CURSOR)}`
const transfers = recordedHistory.results.filter(isTransactionListItem)

const serveTransfers = (firstPage: TransactionItemPage['results'], secondPage: TransactionItemPage['results']) =>
  server.use(
    http.get(OUTGOING_TRANSFERS_URL, ({ request }) => {
      const isSecondPage = new URL(request.url).searchParams.get('cursor') === SECOND_PAGE_CURSOR
      return HttpResponse.json(
        isSecondPage ? { next: null, results: secondPage } : { next: secondPageUrl, results: firstPage },
      )
    }),
  )

const renderTransfersOnly = () =>
  render(<PaginatedTxns useTxns={useTxHistory} />, {
    routerProps: {
      pathname: AppRoutes.transactions.history,
      query: {
        safe: `${TX_HISTORY_SAFE.shortName}:${TX_HISTORY_SAFE.address}`,
        type: 'Outgoing',
        transfers: 'true',
      },
    },
    initialReduxState: {
      safeInfo: { data: historySafe, loading: false, loaded: true },
    },
  })

describe('PaginatedTxns with the transfers only filter', () => {
  beforeEach(() => {
    sentinelObservers.length = 0
    Object.defineProperty(window, 'IntersectionObserver', { configurable: true, value: SentinelObserver })
    jest.spyOn(useChains, 'useCurrentChain').mockReturnValue(sepolia)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('counts the transfers of every loaded page once the last page is in', async () => {
    serveTransfers(transfers.slice(0, 2), transfers.slice(2, 5))
    renderTransfersOnly()
    await screen.findByText('> 2 outgoing transfers found')

    scrollToTheEnd()

    expect(await screen.findByText('5 outgoing transfers found')).toBeInTheDocument()
  })

  it('shows no count while an empty page still has a next page', async () => {
    serveTransfers([], transfers.slice(0, 3))
    renderTransfersOnly()

    await waitFor(() => expect(sentinelObservers).toHaveLength(1))

    expect(screen.queryByText(/found/)).not.toBeInTheDocument()
  })

  it('loads the page after an empty one and counts its transfers', async () => {
    serveTransfers([], transfers.slice(0, 3))
    renderTransfersOnly()
    await waitFor(() => expect(sentinelObservers).toHaveLength(1))

    scrollToTheEnd()

    expect(await screen.findByText('3 outgoing transfers found')).toBeInTheDocument()
    expect(screen.getAllByTestId('transaction-item')).toHaveLength(3)
  })

  it('reports 0 transfers only after the last page comes back empty', async () => {
    serveTransfers([], [])
    renderTransfersOnly()
    await waitFor(() => expect(sentinelObservers).toHaveLength(1))

    scrollToTheEnd()

    expect(await screen.findByText('0 outgoing transfers found')).toBeInTheDocument()
  })
})

const MULTISIG_TXS_URL = `${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/multisig-transactions`
const RECIPIENT = '0x23cbCbbC748c961E570Cfc05Ff65554ECB8955E9'

const renderOutgoing = (filter: Record<string, string>, push = jest.fn(() => Promise.resolve(true))) => {
  render(<PaginatedTxns useTxns={useTxHistory} />, {
    routerProps: {
      pathname: AppRoutes.transactions.history,
      query: { safe: `${TX_HISTORY_SAFE.shortName}:${TX_HISTORY_SAFE.address}`, type: 'Outgoing', ...filter },
      push,
    },
    initialReduxState: {
      safeInfo: { data: historySafe, loading: false, loaded: true },
    },
  })
  return push
}

describe('PaginatedTxns hint to show transfers', () => {
  beforeEach(() => {
    jest.spyOn(useChains, 'useCurrentChain').mockReturnValue(sepolia)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('switches an empty recipient search to transfers and drops amount and nonce', async () => {
    server.use(http.get(MULTISIG_TXS_URL, () => HttpResponse.json({ next: null, previous: null, results: [] })))
    const push = renderOutgoing({ to: RECIPIENT, value: '699', nonce: '64' })

    fireEvent.click(await screen.findByRole('button', { name: 'Show transfers' }))

    const { query } = (push.mock.calls[0] as unknown as [{ query: Record<string, string> }])[0]
    expect(query).toMatchObject({ type: 'Outgoing', to: RECIPIENT, transfers: 'true' })
    expect(query).not.toHaveProperty('value')
    expect(query).not.toHaveProperty('nonce')
  })

  it('shows no hint when the recipient search finds transactions', async () => {
    server.use(http.get(MULTISIG_TXS_URL, () => HttpResponse.json(lastPage)))
    renderOutgoing({ to: RECIPIENT })

    await screen.findAllByTestId('transaction-item')

    expect(screen.queryByRole('button', { name: 'Show transfers' })).not.toBeInTheDocument()
  })

  it('shows no hint for an empty search without a recipient', async () => {
    server.use(http.get(MULTISIG_TXS_URL, () => HttpResponse.json({ next: null, previous: null, results: [] })))
    renderOutgoing({ nonce: '64' })

    await screen.findByText('0 outgoing transactions found')

    expect(screen.queryByRole('button', { name: 'Show transfers' })).not.toBeInTheDocument()
  })
})
