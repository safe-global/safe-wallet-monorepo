import { faker } from '@faker-js/faker'
import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@/tests/test-utils'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { executionInfoBuilder, safeTxSummaryBuilder } from '@/tests/builders/safeTx'
import type { SpaceQueueChain, SpaceQueueSection } from '../../../store/spaceQueueApi'
import SpaceQueueTable from '.'
import { Table, TableBody } from '@safe-global/views/components/ui/table'
import type SpaceQueueRowType from '../SpaceQueueRow'

const mockChainNames: Record<string, string> = {}
const mockScopeProps = jest.fn()
jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: [], loading: false }),
  useCurrentChain: () => undefined,
  useHasFeature: () => false,
  useChain: (chainId: string) =>
    mockChainNames[chainId] ? { chainId, chainName: mockChainNames[chainId] } : undefined,
}))
jest.mock('@/components/tx-flow/safe-scope/SafeScopeProvider', () => ({
  SafeScopeProvider: (props: { initial: unknown; pollSafeInfo: boolean; children: ReactNode }) => {
    mockScopeProps({ initial: props.initial, pollSafeInfo: props.pollSafeInfo })
    return <>{props.children}</>
  },
}))
jest.mock('../SpaceQueueRow', () => ({
  __esModule: true,
  ...jest.requireActual('../SpaceQueueRow'),
  default: ({ item, status, chainId }: { item: TransactionQueuedItem; status: string; chainId: string }) => (
    <tr data-testid="space-queue-row">
      <td>
        {item.transaction.id} {status} {chainId}
      </td>
    </tr>
  ),
}))
jest.mock('@/hooks/useSafeDisplayName', () => ({ useSafeDisplayName: () => '' }))
jest.mock('@/components/transactions/TxSummary/QueueActions', () => ({ __esModule: true, default: () => null }))

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

const section = (safeAddress: string, chains: SpaceQueueChain[]): SpaceQueueSection => ({ safeAddress, chains })

const visibleRows = () => screen.getAllByTestId('space-queue-row').filter((row) => row.closest('[hidden]') === null)

describe('SpaceQueueTable', () => {
  const chainId = faker.string.numeric(3)
  const otherChainId = faker.string.numeric(4)
  const chainName = faker.word.noun()
  const otherChainName = `${faker.word.noun()} chain`
  const safeA = checksumAddress(faker.finance.ethereumAddress())
  const safeB = checksumAddress(faker.finance.ethereumAddress())
  const next = transactionItem('AWAITING_EXECUTION', 3)
  const queued = transactionItem('AWAITING_EXECUTION', 4)
  const sections: SpaceQueueSection[] = [
    section(safeA, [
      { chainId, items: [{ type: 'LABEL', label: 'Next' }, next, { type: 'LABEL', label: 'Queued' }, queued] },
    ]),
    section(safeB, [{ chainId, items: [{ type: 'LABEL', label: 'Next' }, transactionItem('AWAITING_EXECUTION', 9)] }]),
  ]
  const onChainA = transactionItem('AWAITING_EXECUTION', 7)
  const onChainB = transactionItem('AWAITING_EXECUTION', 2)
  const multichain = section(safeA, [
    { chainId, items: [{ type: 'LABEL', label: 'Next' }, onChainA] },
    { chainId: otherChainId, items: [{ type: 'LABEL', label: 'Next' }, onChainB] },
  ])

  beforeEach(() => {
    mockChainNames[chainId] = chainName
    mockChainNames[otherChainId] = otherChainName
  })

  it('renders a band per Safe and its rows inside the Safe scope, without polling', () => {
    render(<SpaceQueueTable sections={sections} />)

    expect(screen.getByText(shortenAddress(safeA))).toBeInTheDocument()
    expect(screen.getByText(shortenAddress(safeB))).toBeInTheDocument()
    expect(screen.getByText(`${next.transaction.id} execute ${chainId}`)).toBeInTheDocument()
    expect(screen.getByText(`${queued.transaction.id} blocked ${chainId}`)).toBeInTheDocument()
    expect(mockScopeProps).toHaveBeenCalledWith({ initial: { chainId, safeAddress: safeA }, pollSafeInfo: false })
    expect(mockScopeProps).toHaveBeenCalledWith({ initial: { chainId, safeAddress: safeB }, pollSafeInfo: false })
  })

  it('has a To column with a screen-reader-only header', () => {
    render(<SpaceQueueTable sections={sections} />)

    const header = screen.getByRole('columnheader', { name: 'To' })
    expect(header.querySelector('.sr-only')).toHaveTextContent('To')
  })

  it('has no Note column', () => {
    render(<SpaceQueueTable sections={sections} />)

    expect(screen.queryByRole('columnheader', { name: 'Note' })).not.toBeInTheDocument()
  })

  it("renders each chain of a multichain Safe in that chain's scope, with its own Next", () => {
    render(<SpaceQueueTable sections={[multichain]} />)

    expect(screen.getByText(`${onChainA.transaction.id} execute ${chainId}`)).toBeInTheDocument()
    expect(screen.getByText(`${onChainB.transaction.id} execute ${otherChainId}`)).toBeInTheDocument()
    expect(mockScopeProps).toHaveBeenCalledWith({ initial: { chainId, safeAddress: safeA }, pollSafeInfo: false })
    expect(mockScopeProps).toHaveBeenCalledWith({
      initial: { chainId: otherChainId, safeAddress: safeA },
      pollSafeInfo: false,
    })
  })

  it('puts a header row per chain with the chain name and the nonce of its next transaction', () => {
    render(<SpaceQueueTable sections={[multichain]} />)

    expect(screen.getByText(chainName).closest('tr')).toHaveTextContent(`${chainName}Next #7`)
    expect(screen.getByText(otherChainName).closest('tr')).toHaveTextContent(`${otherChainName}Next #2`)
  })

  it('omits the next nonce from a chain header when no transaction is next', () => {
    render(<SpaceQueueTable sections={[section(safeA, [{ chainId, items: [queued] }])]} />)

    expect(screen.getByText(chainName).closest('tr')).not.toHaveTextContent('Next #')
  })

  it("collapses only that chain's rows from its header", () => {
    render(<SpaceQueueTable sections={[multichain]} />)

    fireEvent.click(screen.getByRole('button', { name: `Collapse ${chainName}` }))

    expect(screen.getByText(`${onChainA.transaction.id} execute ${chainId}`)).not.toBeVisible()
    expect(screen.getByText(`${onChainB.transaction.id} execute ${otherChainId}`)).toBeVisible()
    expect(screen.getByText(chainName)).toBeVisible()
    expect(screen.getByRole('button', { name: `Expand ${chainName}` })).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(screen.getByRole('button', { name: `Expand ${chainName}` }))

    expect(screen.getByText(`${onChainA.transaction.id} execute ${chainId}`)).toBeVisible()
  })

  it('hides every chain of a collapsed Safe, headers included', () => {
    render(<SpaceQueueTable sections={[multichain]} />)

    fireEvent.click(screen.getByRole('button', { name: `Collapse ${shortenAddress(safeA)}` }))

    expect(screen.getByText(chainName)).not.toBeVisible()
    expect(screen.getByText(otherChainName)).not.toBeVisible()
    expect(visibleRows()).toHaveLength(0)
  })

  it('collapses one Safe and summarises its transactions in the band', () => {
    render(<SpaceQueueTable sections={sections} />)

    fireEvent.click(screen.getByRole('button', { name: `Collapse ${shortenAddress(safeA)}` }))

    expect(screen.getByText(`${next.transaction.id} execute ${chainId}`)).not.toBeVisible()
    expect(screen.getByText('1 to execute · 1 blocked')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: `Expand ${shortenAddress(safeA)}` })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    expect(visibleRows()).toHaveLength(1)
  })

  it('collapses and expands every Safe from the column header', () => {
    render(<SpaceQueueTable sections={sections} />)

    fireEvent.click(screen.getByRole('button', { name: 'Collapse all' }))

    screen.getAllByTestId('space-queue-row').forEach((row) => expect(row).not.toBeVisible())

    fireEvent.click(screen.getByRole('button', { name: 'Expand all' }))

    screen.getAllByTestId('space-queue-row').forEach((row) => expect(row).toBeVisible())
  })

  it('puts a conflict header before transactions that share a nonce', () => {
    const conflicting = section(safeA, [
      {
        chainId,
        items: [
          { type: 'LABEL', label: 'Next' },
          { type: 'CONFLICT_HEADER', nonce: 5 },
          transactionItem('AWAITING_CONFIRMATIONS', 5, 'HasNext'),
          transactionItem('AWAITING_CONFIRMATIONS', 5, 'End'),
        ],
      },
    ])

    render(<SpaceQueueTable sections={[conflicting]} />)

    expect(screen.getByText('Conflicting').closest('tr')).toHaveTextContent(/^5Conflicting/)
    expect(screen.getByText(/Only 1\/2 transactions can execute/)).toBeInTheDocument()
    expect(screen.getAllByTestId('space-queue-row')).toHaveLength(2)
  })

  it('has no Show more', () => {
    render(<SpaceQueueTable sections={sections} />)

    expect(screen.queryByRole('button', { name: 'Show more' })).not.toBeInTheDocument()
  })

  describe('rows', () => {
    const { default: SpaceQueueRow } = jest.requireActual<{ default: typeof SpaceQueueRowType }>('../SpaceQueueRow')

    it('are not expandable', () => {
      render(
        <Table>
          <TableBody>
            <SpaceQueueRow item={next} chainId={chainId} status="execute" />
          </TableBody>
        </Table>,
      )
      const row = screen.getByTestId('space-queue-row')

      fireEvent.click(row)

      expect(row).not.toHaveAttribute('aria-expanded')
      expect(screen.queryByTestId('space-queue-row-details')).not.toBeInTheDocument()
    })
  })
})
