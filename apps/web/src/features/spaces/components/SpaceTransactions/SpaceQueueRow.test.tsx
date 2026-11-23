import { faker } from '@faker-js/faker'
import type { TransactionInfo } from '@safe-global/store/gateway/types'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { render, screen } from '@/tests/test-utils'
import { Counterparty } from './SpaceQueueRow'

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
    expect(join).toHaveClass('text-muted-foreground', 'w-8', 'shrink-0')
    expect(join).not.toHaveClass('capitalize', 'uppercase', 'rounded-md', 'bg-muted')
  })

  it('shows nothing when the transaction has no other party', () => {
    render(<Counterparty txInfo={{ type: 'Custom', isCancellation: true } as TransactionInfo} chainId="1" />)

    expect(screen.queryByTestId('counterparty-join')).not.toBeInTheDocument()
  })
})
