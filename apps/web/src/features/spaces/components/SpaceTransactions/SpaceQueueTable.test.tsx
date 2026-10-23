import { faker } from '@faker-js/faker'
import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@/tests/test-utils'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import type { SpaceQueueSafeItems, TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { executionInfoBuilder, safeTxSummaryBuilder } from '@/tests/builders/safeTx'
import SpaceQueueTable from './SpaceQueueTable'

const mockScopeProps = jest.fn()
jest.mock('@/components/tx-flow/safe-scope/SafeScopeProvider', () => ({
  SafeScopeProvider: (props: { initial: unknown; pollSafeInfo: boolean; children: ReactNode }) => {
    mockScopeProps({ initial: props.initial, pollSafeInfo: props.pollSafeInfo })
    return <>{props.children}</>
  },
}))
jest.mock('./SpaceQueueRow', () => ({
  __esModule: true,
  ...jest.requireActual('./SpaceQueueRow'),
  default: ({ item, status }: { item: TransactionQueuedItem; status: string }) => (
    <tr data-testid="space-queue-row">
      <td>
        {item.transaction.id} {status}
      </td>
    </tr>
  ),
}))
jest.mock('@/hooks/useSafeDisplayName', () => ({ useSafeDisplayName: () => '' }))

const transactionItem = (
  txStatus: Transaction['txStatus'],
  nonce: number,
  conflictType: TransactionQueuedItem['conflictType'] = 'None',
): TransactionQueuedItem => ({
  type: 'TRANSACTION',
  conflictType,
  transaction: safeTxSummaryBuilder()
    .with({
      txStatus,
      timestamp: faker.date.past().getTime(),
      executionInfo: executionInfoBuilder().with({ nonce, missingSigners: [] }).build(),
    })
    .build(),
})

describe('SpaceQueueTable', () => {
  const chainId = faker.string.numeric(3)
  const safeA = checksumAddress(faker.finance.ethereumAddress())
  const safeB = checksumAddress(faker.finance.ethereumAddress())
  const next = transactionItem('AWAITING_EXECUTION', 3)
  const queued = transactionItem('AWAITING_EXECUTION', 4)
  const sections: SpaceQueueSafeItems[] = [
    {
      chainId,
      safeAddress: safeA,
      items: [{ type: 'LABEL', label: 'Next' }, next, { type: 'LABEL', label: 'Queued' }, queued],
    },
    {
      chainId,
      safeAddress: safeB,
      items: [{ type: 'LABEL', label: 'Next' }, transactionItem('AWAITING_EXECUTION', 9)],
    },
  ]

  it('renders a band per Safe and its rows inside the Safe scope, without polling', () => {
    render(<SpaceQueueTable sections={sections} />)

    expect(screen.getByText(shortenAddress(safeA))).toBeInTheDocument()
    expect(screen.getByText(shortenAddress(safeB))).toBeInTheDocument()
    expect(screen.getByText(`${next.transaction.id} execute`)).toBeInTheDocument()
    expect(screen.getByText(`${queued.transaction.id} blocked`)).toBeInTheDocument()
    expect(mockScopeProps).toHaveBeenCalledWith({ initial: { chainId, safeAddress: safeA }, pollSafeInfo: false })
    expect(mockScopeProps).toHaveBeenCalledWith({ initial: { chainId, safeAddress: safeB }, pollSafeInfo: false })
  })

  it('collapses one Safe and summarises its transactions in the band', () => {
    render(<SpaceQueueTable sections={sections} />)

    fireEvent.click(screen.getByRole('button', { name: `Collapse ${shortenAddress(safeA)}` }))

    expect(screen.getByText(`${next.transaction.id} execute`)).not.toBeVisible()
    expect(screen.getByText('1 to execute · 1 blocked')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: `Expand ${shortenAddress(safeA)}` })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    expect(screen.getAllByTestId('space-queue-row').filter((row) => row.closest('[hidden]') === null)).toHaveLength(1)
  })

  it('collapses and expands every Safe from the column header', () => {
    render(<SpaceQueueTable sections={sections} />)

    fireEvent.click(screen.getByRole('button', { name: 'Collapse all' }))

    screen.getAllByTestId('space-queue-row').forEach((row) => expect(row).not.toBeVisible())

    fireEvent.click(screen.getByRole('button', { name: 'Expand all' }))

    screen.getAllByTestId('space-queue-row').forEach((row) => expect(row).toBeVisible())
  })

  it('puts a conflict header before transactions that share a nonce', () => {
    const conflicting: SpaceQueueSafeItems = {
      chainId,
      safeAddress: safeA,
      items: [
        { type: 'LABEL', label: 'Next' },
        { type: 'CONFLICT_HEADER', nonce: 5 },
        transactionItem('AWAITING_CONFIRMATIONS', 5, 'HasNext'),
        transactionItem('AWAITING_CONFIRMATIONS', 5, 'End'),
      ],
    }

    render(<SpaceQueueTable sections={[conflicting]} />)

    expect(screen.getByText('Conflicting').closest('tr')).toHaveTextContent(/^5Conflicting/)
    expect(screen.getByText(/Only 1\/2 transactions can execute/)).toBeInTheDocument()
    expect(screen.getAllByTestId('space-queue-row')).toHaveLength(2)
  })
})
