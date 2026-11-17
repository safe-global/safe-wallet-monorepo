import { faker } from '@faker-js/faker'
import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { TransactionStatus } from '@safe-global/store/gateway/types'
import { Table, TableBody } from '@safe-global/views/components/ui/table'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { executionInfoBuilder, safeTxSummaryBuilder } from '@/tests/builders/safeTx'
import { fireEvent, render, screen } from '@/tests/test-utils'
import { DeleteTxDialogProvider } from './RowActionsMenu/DeleteTxDialog'
import SpaceQueueRow from './SpaceQueueRow'

jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))
const mockTrackEvent = trackEvent as jest.MockedFunction<typeof trackEvent>

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: [], loading: false }),
  useCurrentChain: () => undefined,
  useHasFeature: () => false,
  useChain: () => undefined,
}))
jest.mock('@/components/transactions/TxSummary/QueueActions', () => ({
  __esModule: true,
  default: ({ tx }: { tx: Transaction }) => (
    <button type="button">{tx.txStatus === 'AWAITING_EXECUTION' ? 'Execute' : 'Sign'}</button>
  ),
}))
jest.mock('./RowActionsMenu', () => ({ __esModule: true, default: () => null }))

const mockIsPending = { current: false }
jest.mock('@/hooks/useIsPending', () => ({ __esModule: true, default: () => mockIsPending.current }))

const spaceId = faker.string.uuid()
const chainId = faker.string.numeric(3)

const queuedItem = (txStatus: Transaction['txStatus']): TransactionQueuedItem => ({
  type: 'TRANSACTION',
  conflictType: 'None',
  transaction: safeTxSummaryBuilder()
    .with({
      txStatus,
      timestamp: faker.date.past().getTime(),
      executionInfo: executionInfoBuilder().with({ missingSigners: [] }).build(),
    })
    .build(),
})

const renderRow = (item: TransactionQueuedItem) =>
  render(
    <DeleteTxDialogProvider>
      <Table>
        <TableBody>
          <SpaceQueueRow item={item} chainId={chainId} status="sign" />
        </TableBody>
      </Table>
    </DeleteTxDialogProvider>,
    { routerProps: { query: { spaceId } } },
  )

describe('SpaceQueueRow', () => {
  beforeEach(() => {
    mockTrackEvent.mockClear()
    mockIsPending.current = false
  })

  it('tracks Sign once as a confirmation started from the Workspace', () => {
    renderRow(queuedItem(TransactionStatus.AWAITING_CONFIRMATIONS))

    fireEvent.click(screen.getByRole('button', { name: 'Sign' }))

    expect(mockTrackEvent.mock.calls).toEqual([
      [
        SPACE_EVENTS.TRANSACTION_INITIATED,
        { workspace_id: spaceId, action: 'confirm', entry_point: 'space_transactions' },
      ],
    ])
  })

  it('tracks Execute once as an execution started from the Workspace', () => {
    renderRow(queuedItem(TransactionStatus.AWAITING_EXECUTION))

    fireEvent.click(screen.getByRole('button', { name: 'Execute' }))

    expect(mockTrackEvent.mock.calls).toEqual([
      [
        SPACE_EVENTS.TRANSACTION_INITIATED,
        { workspace_id: spaceId, action: 'execute', entry_point: 'space_transactions' },
      ],
    ])
  })

  it('does not track a click in the actions of a pending transaction', () => {
    mockIsPending.current = true
    renderRow(queuedItem(TransactionStatus.AWAITING_EXECUTION))

    fireEvent.click(screen.getByRole('button', { name: 'Execute' }))

    expect(mockTrackEvent).not.toHaveBeenCalled()
  })
})
