import { faker } from '@faker-js/faker'
import { id } from 'ethers'
import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { render, screen } from '@/tests/test-utils'
import { safeTxSummaryBuilder } from '@/tests/builders/safeTx'
import type { RecoveryQueueItem } from '../../services/recovery-state'
import GroupedRecoveryListItems from '.'

jest.mock('@/components/transactions/TxListItem/ExpandableTransactionItem', () => ({
  __esModule: true,
  default: ({ isNested }: { isNested?: boolean }) => (
    <div data-testid="cancellation-row" data-nested={String(!!isNested)} />
  ),
}))

jest.mock('../RecoverySummary', () => ({
  __esModule: true,
  default: () => <div>Account recovery</div>,
}))

jest.mock('../RecoveryDetails', () => ({
  __esModule: true,
  default: () => <div>Recovery details</div>,
}))

const cancellation: TransactionQueuedItem = {
  type: 'TRANSACTION',
  conflictType: 'HasNext',
  transaction: safeTxSummaryBuilder().build(),
}

const recovery = {
  transactionHash: faker.string.hexadecimal({ length: 64 }),
  fragment: { topicHash: id('TransactionAdded(uint256,bytes32,address,uint256,bytes,uint8)') },
  isMalicious: false,
} as unknown as RecoveryQueueItem

describe('GroupedRecoveryListItems', () => {
  it('nests the cancellation and the recovery on the group surface', () => {
    render(<GroupedRecoveryListItems items={[cancellation, recovery]} />)

    expect(screen.getByTestId('cancellation-row')).toHaveAttribute('data-nested', 'true')
    expect(screen.getByTestId('recovery-item')).toHaveClass('listItemNested')
  })

  it('draws the cancellation disclaimer once', () => {
    const { container } = render(<GroupedRecoveryListItems items={[cancellation, recovery]} />)

    expect(screen.getByText('Cancelling Account recovery.')).toBeInTheDocument()
    expect(container.getElementsByClassName('disclaimerContainer')).toHaveLength(1)
  })
})
