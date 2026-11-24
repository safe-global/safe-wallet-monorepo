import { faker } from '@faker-js/faker'
import type { TransactionInfo } from '@safe-global/store/gateway/types'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { formatDateTime } from '@safe-global/utils/utils/date'
import { advanceClock, render, renderOnFakeClock, renderWithUserEvent, screen } from '@/tests/test-utils'
import { Counterparty, ProposedTime } from './SpaceQueueRow'

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

  it('shows the name in a tooltip, not a browser title', async () => {
    const txInfo = transfer('OUTGOING')
    const { name } = (txInfo as { recipient: { name: string } }).recipient
    const { container, user } = renderWithUserEvent(<Counterparty txInfo={txInfo} chainId="1" />)

    expect(container.querySelector('[title]')).toBeNull()
    await user.tab()
    expect(screen.getByTestId('eth-hash-info-name')).toHaveFocus()
    expect(screen.getByTestId('eth-hash-info-name')).toHaveClass(
      'outline-hidden',
      'focus-visible:ring-[3px]',
      'focus-visible:ring-inset',
      'focus-visible:ring-ring/50',
    )

    expect(await screen.findByText(name, { selector: '[data-slot="tooltip-content"]' })).toBeInTheDocument()
  })

  it('shows nothing when the transaction has no other party', () => {
    render(<Counterparty txInfo={{ type: 'Custom', isCancellation: true } as TransactionInfo} chainId="1" />)

    expect(screen.queryByTestId('counterparty-join')).not.toBeInTheDocument()
  })
})

describe('ProposedTime', () => {
  afterEach(() => jest.useRealTimers())

  it('shows the short time, with the full date and time in the tooltip', async () => {
    const timestamp = new Date('2026-06-15T12:00:00.000Z').getTime()
    jest.useFakeTimers({ now: timestamp + 3 * 24 * 60 * 60 * 1000 })

    const { user } = renderOnFakeClock(<ProposedTime timestamp={timestamp} />)

    const trigger = screen.getByText('3d ago')
    expect(screen.queryByText(formatDateTime(timestamp))).not.toBeInTheDocument()

    await user.hover(trigger)
    await advanceClock(500)

    expect(await screen.findByText(formatDateTime(timestamp))).toBeInTheDocument()
  })
})
