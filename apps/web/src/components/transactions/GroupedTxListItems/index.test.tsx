import { useContext } from 'react'
import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import { render, renderWithUserEvent, screen } from '@/tests/test-utils'
import { executionInfoBuilder, safeTxSummaryBuilder } from '@/tests/builders/safeTx'
import { pendingTxBuilder } from '@/tests/builders/pendingTx'
import { ReplaceTxHoverContext } from './ReplaceTxHoverProvider'
import GroupedTxListItems from '.'

const ROW_TEST_ID = 'conflicting-tx'

const MockTxRow = ({ item }: { item: TransactionQueuedItem }) => {
  const { setSelectedTxId } = useContext(ReplaceTxHoverContext)
  const { id } = item.transaction

  return (
    <div
      data-testid={ROW_TEST_ID}
      onMouseEnter={() => setSelectedTxId(id)}
      onMouseLeave={() => setSelectedTxId(undefined)}
    >
      {id}
    </div>
  )
}

jest.mock('@/components/transactions/TxListItem/ExpandableTransactionItem', () => ({
  __esModule: true,
  default: (props: { item: TransactionQueuedItem }) => <MockTxRow {...props} />,
}))

const REPLACED_CLASS = 'willBeReplaced'

const conflictingTxs = (nonce: number, count: number): TransactionQueuedItem[] =>
  Array.from({ length: count }, () => ({
    type: 'TRANSACTION',
    conflictType: 'HasNext',
    transaction: safeTxSummaryBuilder()
      .with({ executionInfo: executionInfoBuilder().with({ nonce }).build() })
      .build(),
  }))

const rowWrapperOf = (item: TransactionQueuedItem) => screen.getByText(item.transaction.id).parentElement

describe('GroupedTxListItems', () => {
  it('renders nothing for an empty group', () => {
    const { container } = render(<GroupedTxListItems groupedListItems={[]} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('shows the shared nonce once and one row for each conflicting transaction', () => {
    const nonce = 42

    render(<GroupedTxListItems groupedListItems={conflictingTxs(nonce, 3)} />)

    expect(screen.getByText(String(nonce))).toBeInTheDocument()
    expect(screen.getAllByTestId(ROW_TEST_ID)).toHaveLength(3)
  })

  it('warns that executing one conflicting transaction replaces the others', () => {
    render(<GroupedTxListItems groupedListItems={conflictingTxs(1, 2)} />)

    expect(screen.getByText('Conflicting transactions')).toBeInTheDocument()
    expect(screen.getByText(/Executing one will automatically replace the others/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Why did this happen?' })).toHaveAttribute(
      'href',
      HelpCenterArticle.CONFLICTING_TRANSACTIONS,
    )
  })

  it('marks no transaction as replaced by default', () => {
    const group = conflictingTxs(1, 2)

    render(<GroupedTxListItems groupedListItems={group} />)

    group.forEach((item) => expect(rowWrapperOf(item)).not.toHaveClass(REPLACED_CLASS))
  })

  it('marks the other transactions as replaced while one is being executed', () => {
    const [pendingTx, ...otherTxs] = conflictingTxs(1, 3)
    const pendingTxs = { [pendingTx.transaction.id]: pendingTxBuilder().build() }

    render(<GroupedTxListItems groupedListItems={[pendingTx, ...otherTxs]} />, {
      initialReduxState: { pendingTxs },
    })

    expect(rowWrapperOf(pendingTx)).not.toHaveClass(REPLACED_CLASS)
    otherTxs.forEach((item) => expect(rowWrapperOf(item)).toHaveClass(REPLACED_CLASS))
  })

  it('marks the other transactions as replaced while one is hovered for execution', async () => {
    const [hoveredTx, otherTx] = conflictingTxs(1, 2)
    const { user } = renderWithUserEvent(<GroupedTxListItems groupedListItems={[hoveredTx, otherTx]} />)

    await user.hover(screen.getByText(hoveredTx.transaction.id))

    expect(rowWrapperOf(hoveredTx)).not.toHaveClass(REPLACED_CLASS)
    expect(rowWrapperOf(otherTx)).toHaveClass(REPLACED_CLASS)
  })

  it('clears the replaced marking when the hover ends', async () => {
    const [hoveredTx, otherTx] = conflictingTxs(1, 2)
    const { user } = renderWithUserEvent(<GroupedTxListItems groupedListItems={[hoveredTx, otherTx]} />)

    await user.hover(screen.getByText(hoveredTx.transaction.id))
    await user.unhover(screen.getByText(hoveredTx.transaction.id))

    expect(rowWrapperOf(otherTx)).not.toHaveClass(REPLACED_CLASS)
  })
})
