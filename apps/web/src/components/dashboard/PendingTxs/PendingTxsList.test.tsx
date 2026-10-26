import { faker } from '@faker-js/faker'
import type {
  MultisigExecutionInfo,
  QueuedItemPage,
  Transaction,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { RecoveryQueueItem } from '@/features/recovery'
import { render, screen, within } from '@/tests/test-utils'
import { safeInfoBuilder } from '@/tests/builders/safe'
import {
  multisigExecutionInfoBuilder,
  multisigTransactionBuilder,
  queuedTransactionItem,
} from '@/tests/builders/queuedTransaction'
import PendingTxsList from './PendingTxsList'

jest.mock('@/hooks/useTxQueue')
jest.mock('@/hooks/useSafeInfo')
jest.mock('@/hooks/wallets/useWallet')
jest.mock('@/features/recovery', () => ({
  ...jest.requireActual('@/features/recovery'),
  useRecoveryQueue: jest.fn(),
}))
// The rows' own content has its tests in PendingTxListItem.test.tsx; these stand-ins need no address book.
jest.mock('@/components/transactions/TxType', () => ({
  TxTypeIcon: () => null,
  TxTypeText: () => <span>Transaction</span>,
}))
jest.mock('@/components/transactions/TxInfo', () => ({ __esModule: true, default: () => null }))
jest.mock('./PendingRecoveryListItem', () => ({
  __esModule: true,
  default: () => <div data-testid="recovery-item">Recovery</div>,
}))

const mockUseTxQueue = jest.requireMock('@/hooks/useTxQueue').default as jest.Mock
const mockUseQueuedTxsLength = jest.requireMock('@/hooks/useTxQueue').useQueuedTxsLength as jest.Mock
const mockUseSafeInfo = jest.requireMock('@/hooks/useSafeInfo').default as jest.Mock
const mockUseWallet = jest.requireMock('@/hooks/wallets/useWallet').default as jest.Mock
const mockUseRecoveryQueue = jest.requireMock('@/features/recovery').useRecoveryQueue as jest.Mock

const SAFE_ADDRESS = '0x1111111111111111111111111111111111111111'
const safe = safeInfoBuilder()
  .with({ nonce: 5, address: { value: SAFE_ADDRESS } })
  .build()

const proposal = (nonce: number, execution: Partial<MultisigExecutionInfo> = {}, timestamp?: number): Transaction =>
  multisigTransactionBuilder()
    .with({
      executionInfo: multisigExecutionInfoBuilder()
        .with({ nonce, ...execution })
        .build(),
      ...(timestamp === undefined ? {} : { timestamp }),
    })
    .build()

const queuePage = (results: QueuedItemPage['results']): QueuedItemPage => ({ count: results.length, results })

function renderWidget(page: QueuedItemPage | undefined, { loading = false } = {}) {
  mockUseTxQueue.mockReturnValue({ page, loading })
  return render(<PendingTxsList />, { routerProps: { query: { safe: `eth:${SAFE_ADDRESS}` } } })
}

const rowLinks = () => screen.getAllByTestId('tx-pending-item').map((row) => row.getAttribute('href'))

describe('PendingTxsList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSafeInfo.mockReturnValue({ safe, safeAddress: SAFE_ADDRESS, safeLoaded: true, safeLoading: false })
    mockUseWallet.mockReturnValue(null)
    mockUseRecoveryQueue.mockReturnValue([])
    mockUseQueuedTxsLength.mockReturnValue('')
  })

  it('shows a placeholder while the queue loads', () => {
    renderWidget(undefined, { loading: true })

    expect(screen.getByText('Pending transactions')).toBeInTheDocument()
    expect(screen.queryByTestId('pending-tx-widget')).not.toBeInTheDocument()
  })

  it('says that there is nothing to sign, without a link to the queue, when the queue is empty', () => {
    renderWidget(queuePage([]))

    expect(screen.getByTestId('no-tx-text')).toHaveTextContent('No transactions to sign')
    expect(screen.queryByTestId('view-all-link')).not.toBeInTheDocument()
  })

  it('lists the queued transactions with their confirmations and links to the queue of the Safe', () => {
    const first = proposal(5)
    const second = proposal(6, { confirmationsSubmitted: 2, confirmationsRequired: 3 })
    mockUseQueuedTxsLength.mockReturnValue('2')

    renderWidget(queuePage([queuedTransactionItem(first), queuedTransactionItem(second)]))

    expect(rowLinks()).toEqual([expect.stringContaining(`id=${first.id}`), expect.stringContaining(`id=${second.id}`)])
    const rows = screen.getAllByTestId('tx-pending-item')
    expect(within(rows[0]).getByText('1/2')).toBeInTheDocument()
    expect(within(rows[1]).getByText('2/3')).toBeInTheDocument()
    expect(within(screen.getByTestId('pending-tx-widget')).getByText('2')).toBeInTheDocument()
    expect(screen.getByTestId('view-all-link')).toHaveAttribute(
      'href',
      expect.stringMatching(new RegExp(`^/transactions/queue\\?safe=eth(%3A|:)${SAFE_ADDRESS}`)),
    )
  })

  it('shows one row per nonce: the newest of the conflicting proposals', () => {
    const older = proposal(5, {}, 1_000)
    const newer = proposal(5, {}, 2_000)
    const next = proposal(6)

    renderWidget(
      queuePage([
        { type: 'CONFLICT_HEADER', nonce: 5 },
        queuedTransactionItem(older, 'HasNext'),
        queuedTransactionItem(newer, 'End'),
        queuedTransactionItem(next),
      ]),
    )

    expect(rowLinks()).toEqual([expect.stringContaining(`id=${newer.id}`), expect.stringContaining(`id=${next.id}`)])
  })

  it('shows at most four transactions', () => {
    renderWidget(queuePage([5, 6, 7, 8, 9, 10].map((nonce) => queuedTransactionItem(proposal(nonce)))))

    expect(screen.getAllByTestId('tx-pending-item')).toHaveLength(4)
  })

  it('shows a connected owner only the transactions that wait for their signature', () => {
    const owner = faker.finance.ethereumAddress()
    const waitsForOwner = proposal(6, { missingSigners: [{ value: owner }] })
    mockUseWallet.mockReturnValue({ address: owner })

    renderWidget(queuePage([queuedTransactionItem(proposal(5)), queuedTransactionItem(waitsForOwner)]))

    expect(rowLinks()).toEqual([expect.stringContaining(`id=${waitsForOwner.id}`)])
  })

  it('shows pending recoveries before the queued transactions', async () => {
    mockUseRecoveryQueue.mockReturnValue([{ transactionHash: '0xrecovery' } as RecoveryQueueItem])

    renderWidget(queuePage([queuedTransactionItem(proposal(5))]))

    const recovery = await screen.findByTestId('recovery-item')
    const [row] = screen.getAllByTestId('tx-pending-item')
    expect(recovery.compareDocumentPosition(row) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
