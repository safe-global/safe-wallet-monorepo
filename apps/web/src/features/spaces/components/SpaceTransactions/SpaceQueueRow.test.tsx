import { faker } from '@faker-js/faker'
import type { TransactionInfo } from '@safe-global/store/gateway/types'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { render, renderWithUserEvent, screen, within } from '@/tests/test-utils'
import { Table, TableBody } from '@safe-global/views/components/ui/table'
import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { executionInfoBuilder, safeTxSummaryBuilder } from '@/tests/builders/safeTx'
import SpaceQueueRow, { Counterparty } from './SpaceQueueRow'

jest.mock('@/components/transactions/TxSummary/QueueActions', () => ({
  __esModule: true,
  default: () => <button>Sign</button>,
}))
jest.mock('./RowActionsMenu', () => ({ __esModule: true, default: () => <button>More</button> }))
jest.mock('./SignersTooltip', () => ({
  __esModule: true,
  default: ({ submitted, required }: { submitted: number; required: number }) => (
    <span data-testid="signature-gauge">
      {submitted}/{required}
    </span>
  ),
}))
jest.mock('./QueueRowSafeTag', () => ({ __esModule: true, default: () => <span data-testid="queue-safe-tag" /> }))

const party = () => ({ value: checksumAddress(faker.finance.ethereumAddress()), name: faker.person.fullName() })

const transfer = (direction: 'INCOMING' | 'OUTGOING') =>
  ({
    type: 'Transfer',
    direction,
    sender: party(),
    recipient: party(),
    transferInfo: { type: 'NATIVE_COIN', value: '1' },
  }) as TransactionInfo

describe('Counterparty', () => {
  it.each([
    ['to', transfer('OUTGOING')],
    ['from', transfer('INCOMING')],
    ['via', { type: 'Custom', methodName: 'multiSend', to: party() } as TransactionInfo],
    ['on', { type: 'Custom', methodName: 'approve', to: party() } as TransactionInfo],
    ['via', { type: 'SwapAndBridge' } as TransactionInfo],
    ['on', { type: 'SwapOrder' } as TransactionInfo],
  ])('shows "%s" as a lowercase grey word, not a pill', (word, txInfo) => {
    render(<Counterparty txInfo={txInfo} chainId="1" />)

    const join = screen.getByTestId('counterparty-join')
    expect(join).toHaveTextContent(new RegExp(`^${word}$`))
    expect(join).toHaveClass('text-muted-foreground', 'group-hover/transaction:text-foreground', 'w-8', 'shrink-0')
    expect(join).not.toHaveClass('capitalize', 'uppercase', 'rounded-md', 'bg-muted')
  })

  it('opens the party card on focus, with no browser title', async () => {
    const txInfo = transfer('OUTGOING')
    const { name, value } = (txInfo as { recipient: { name: string; value: string } }).recipient
    const { container, user } = renderWithUserEvent(<Counterparty txInfo={txInfo} chainId="1" />)

    expect(container.querySelector('[title]')).toBeNull()
    await user.tab()
    const trigger = screen.getByTestId('counterparty-party')
    expect(trigger).toHaveFocus()
    expect(trigger).toHaveClass('outline-hidden', 'focus-visible:ring-[3px]', 'focus-visible:ring-ring/50')

    expect(screen.getByText(name, { selector: '[data-testid="counterparty-party"] span' })).not.toHaveClass('font-mono')
    const card = await screen.findByText(name, { selector: '[data-slot="tooltip-content"] *' })
    expect(card).toHaveClass('font-medium')
    expect(screen.getByText(value)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument()
  })

  it('says an unnamed party is not in the address book and shows its short address', async () => {
    const txInfo = { type: 'Custom', methodName: 'approve', to: { value: party().value } } as TransactionInfo
    const { value } = (txInfo as { to: { value: string } }).to
    const { user } = renderWithUserEvent(<Counterparty txInfo={txInfo} chainId="1" />)

    expect(screen.getByTestId('counterparty-party')).toHaveTextContent(shortenAddress(value))
    expect(screen.getByText(shortenAddress(value))).toHaveClass('font-mono', 'text-xs')
    await user.tab()

    expect(await screen.findByText('Not in your address book')).toBeInTheDocument()
  })

  it('shows a protocol by name, with no party card', () => {
    render(<Counterparty txInfo={{ type: 'SwapOrder' } as TransactionInfo} chainId="1" />)

    expect(screen.getByText('CoW Protocol')).toBeInTheDocument()
    expect(screen.queryByTestId('counterparty-party')).not.toBeInTheDocument()
  })

  it('shows nothing when the transaction has no other party', () => {
    render(<Counterparty txInfo={{ type: 'Custom', isCancellation: true } as TransactionInfo} chainId="1" />)

    expect(screen.queryByTestId('counterparty-join')).not.toBeInTheDocument()
  })
})

describe('SpaceQueueRow', () => {
  const safeAddress = checksumAddress(faker.finance.ethereumAddress())
  const item = (nonce: number): TransactionQueuedItem => ({
    type: 'TRANSACTION',
    conflictType: 'None',
    transaction: safeTxSummaryBuilder()
      .with({
        txStatus: 'AWAITING_CONFIRMATIONS',
        timestamp: faker.date.past().getTime(),
        executionInfo: executionInfoBuilder()
          .with({ nonce, confirmationsSubmitted: 1, confirmationsRequired: 2 })
          .build(),
      })
      .build(),
  })

  const renderRow = (props: { compact?: boolean; status?: 'sign' | 'blocked'; nextNonce?: number }) =>
    render(
      <Table>
        <TableBody>
          <SpaceQueueRow
            item={item(7)}
            chainId="1"
            status={props.status ?? 'sign'}
            nextNonce={props.nextNonce}
            safeAddress={safeAddress}
            compact={props.compact}
          />
        </TableBody>
      </Table>,
    )

  it.each([false, true])('keeps the nonce and the action in the row (compact: %s)', (compact) => {
    renderRow({ compact })

    const row = screen.getByTestId('space-queue-row')
    const cells = within(row).getAllByRole('cell')
    expect(cells[0]).toHaveTextContent('7')
    expect(within(cells[cells.length - 1]).getByRole('button', { name: 'Sign' })).toBeInTheDocument()
    expect(within(row).getByRole('button', { name: 'More' })).toBeInTheDocument()
    expect(within(row).getByTestId('signature-gauge')).toHaveTextContent('1/2')
    expect(within(row).getByTestId('queue-safe-tag')).toBeInTheDocument()
  })

  it('pins the nonce and the action cells, so a table scrolling sideways keeps them in view', () => {
    renderRow({})

    const cells = within(screen.getByTestId('space-queue-row')).getAllByRole('cell')
    expect(cells).toHaveLength(6)
    expect(cells[0]).toHaveAttribute('data-pin', 'start')
    expect(cells[5]).toHaveAttribute('data-pin', 'end')
    cells.slice(1, 5).forEach((cell) => expect(cell).not.toHaveAttribute('data-pin'))
  })

  it('puts everything but the nonce in one cell when compact, with no type column or proposed time', () => {
    renderRow({ compact: true })

    const row = screen.getByTestId('space-queue-row')
    const cells = within(row).getAllByRole('cell')
    expect(cells).toHaveLength(2)
    expect(cells[1]).toHaveAttribute('colspan', '5')
    expect(row).not.toHaveClass('h-14')
  })

  it('shows Blocked by in place of the button when compact too', () => {
    renderRow({ compact: true, status: 'blocked', nextNonce: 5 })

    const row = screen.getByTestId('space-queue-row')
    expect(within(row).getByRole('button', { name: /Blocked by #5/ })).toBeInTheDocument()
    expect(within(row).queryByRole('button', { name: 'Sign' })).not.toBeInTheDocument()
  })
})
