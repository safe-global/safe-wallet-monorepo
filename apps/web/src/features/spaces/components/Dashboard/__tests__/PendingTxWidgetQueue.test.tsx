import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import type { SpaceQueuedItemPage, TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { TransactionListItemType } from '@safe-global/store/gateway/types'
import { setBaseUrl } from '@safe-global/store/gateway/cgwClient'
import { GATEWAY_URL } from '@/config/gateway'
import { safeTxSummaryBuilder } from '@/tests/builders/safeTx'
import { server } from '@/tests/server'
import { render, screen } from '@/tests/test-utils'
import { useSpacePendingTransactions } from '../../../hooks/useSpacePendingTransactions'
import PendingTxWidget from '../PendingTxWidget'

jest.mock('@/hooks/useChains', () => ({ useHasFeature: () => true }))
jest.mock('@/store/authSlice', () => ({ ...jest.requireActual('@/store/authSlice'), isAuthenticated: () => true }))
jest.mock('../../../public/hooks/useCurrentSpaceId', () => ({ useCurrentSpaceId: () => spaceId }))
jest.mock('../../../hooks/usePerSafePendingTransactions', () => ({
  usePerSafePendingTransactions: () => ({ transactions: [], count: 0, isLoading: false, error: undefined }),
}))
jest.mock('@/components/transactions/TxType', () => ({
  TxTypeIcon: () => null,
  TxTypeText: () => <span data-testid="tx-type-text">Send</span>,
}))
jest.mock('@/components/transactions/TxInfo', () => ({ __esModule: true, default: () => null }))
jest.mock('@safe-global/views/components/common/Identicon', () => ({ __esModule: true, default: () => null }))
jest.mock('@/features/transactions/public/utils', () => ({ getTxStatus: () => 'Awaiting confirmations' }))
jest.mock('@safe-global/utils/utils/date', () => ({ formatTimeInWords: () => '2 hours ago' }))

const spaceId = faker.string.uuid()
const queueUrl = `${GATEWAY_URL}/v1/spaces/${spaceId}/transactions/queued`

const queuedTx = (): TransactionQueuedItem => ({
  type: TransactionListItemType.TRANSACTION,
  conflictType: 'None',
  transaction: safeTxSummaryBuilder().build(),
})

const page = (
  results: SpaceQueuedItemPage['results'],
  overrides: Partial<SpaceQueuedItemPage> = {},
): SpaceQueuedItemPage => ({
  count: null,
  next: null,
  previous: null,
  results,
  unavailableSafes: [],
  counts: {
    total: 0,
    execute: 0,
    sign: 0,
    blocked: 0,
    waiting: 0,
    conflicting: 0,
    stale: 0,
    safes: [],
    chains: [],
    signers: [],
  },
  ...overrides,
})

const PendingWidget = () => {
  const { transactions, isLoading, error } = useSpacePendingTransactions(3)
  return <PendingTxWidget transactions={transactions} loading={isLoading} error={error} />
}

const respondWith = (body: SpaceQueuedItemPage) => server.use(http.get(queueUrl, () => HttpResponse.json(body)))

describe('Dashboard Pending widget', () => {
  beforeEach(() => {
    setBaseUrl(GATEWAY_URL)
  })

  it('shows the pending transactions when some Safes are unavailable', async () => {
    const safeAddress = faker.finance.ethereumAddress()
    respondWith(
      page(
        { [safeAddress]: { '1': [queuedTx()] } },
        { unavailableSafes: [{ chainId: '137', safeAddress: faker.finance.ethereumAddress() }] },
      ),
    )

    render(<PendingWidget />)

    expect(await screen.findByTestId('tx-type-text')).toBeInTheDocument()
    expect(screen.queryByText('Unable to load content')).not.toBeInTheDocument()
  })

  it('shows the empty state when no transaction is pending', async () => {
    respondWith(page({}))

    render(<PendingWidget />)

    expect(await screen.findByText('No pending transactions')).toBeInTheDocument()
  })
})
