import { faker } from '@faker-js/faker'
import { fireEvent, render, screen } from '@/tests/test-utils'
import type { ReactNode } from 'react'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import type {
  SpaceQueuedItemPage,
  SpaceQueueSafeItems,
  TransactionQueuedItem,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import * as spacesApi from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import SpaceTransactionQueue from './SpaceTransactionQueue'

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  ...jest.requireActual('@safe-global/store/gateway/AUTO_GENERATED/spaces'),
  useSpaceTransactionsGetTransactionQueueV1Query: jest.fn(),
}))

const mockScopeProps = jest.fn()
jest.mock('@/components/tx-flow/safe-scope/SafeScopeProvider', () => ({
  SafeScopeProvider: (props: { initial: unknown; pollSafeInfo: boolean; children: ReactNode }) => {
    mockScopeProps({ initial: props.initial, pollSafeInfo: props.pollSafeInfo })
    return <>{props.children}</>
  },
}))
jest.mock('@/components/transactions/TxList', () => {
  const { useTxRowSafe } = jest.requireActual('@/components/transactions/TxSummary/TxRowSafeContext')
  const TxList = ({ items }: { items: unknown[] }) => {
    const rowSafe = useTxRowSafe()
    return (
      <div data-testid="tx-list">
        {items.length} items of {rowSafe?.chainId}:{rowSafe?.safeAddress}
      </div>
    )
  }
  return { __esModule: true, default: TxList }
})
jest.mock('@/components/common/InfiniteScroll', () => ({
  __esModule: true,
  default: ({ onLoadMore }: { onLoadMore: () => void }) => <button onClick={onLoadMore}>load more</button>,
}))

const mockQuery = spacesApi.useSpaceTransactionsGetTransactionQueueV1Query as jest.Mock

const transactionItem = (): TransactionQueuedItem =>
  ({ type: 'TRANSACTION', transaction: { id: faker.string.uuid() } }) as TransactionQueuedItem

const run = (chainId: string, safeAddress: string, count: number): SpaceQueueSafeItems => ({
  chainId,
  safeAddress,
  items: Array.from({ length: count }, transactionItem),
})

const page = (results: SpaceQueueSafeItems[], overrides: Partial<SpaceQueuedItemPage> = {}): SpaceQueuedItemPage => ({
  count: results.length,
  next: null,
  previous: null,
  results,
  unavailableSafes: [],
  ...overrides,
})

describe('SpaceTransactionQueue', () => {
  const spaceId = faker.string.uuid()
  const chainId = faker.string.numeric(3)
  const safeA = checksumAddress(faker.finance.ethereumAddress())
  const safeB = checksumAddress(faker.finance.ethereumAddress())

  const mockPages = (pagesByCursor: Record<string, SpaceQueuedItemPage>) => {
    mockQuery.mockImplementation(({ cursor }: { cursor?: string }) => ({
      currentData: pagesByCursor[cursor ?? ''],
      isError: false,
    }))
  }

  it('renders every Safe run in its own scope, without polling, and names the Safe on its rows', () => {
    mockPages({ '': page([run(chainId, safeA, 2), run(chainId, safeB, 1)]) })

    render(<SpaceTransactionQueue spaceId={spaceId} />)

    const lists = screen.getAllByTestId('tx-list')
    expect(lists).toHaveLength(2)
    expect(lists[0]).toHaveTextContent(`2 items of ${chainId}:${safeA}`)
    expect(lists[1]).toHaveTextContent(`1 items of ${chainId}:${safeB}`)
    expect(mockScopeProps).toHaveBeenCalledWith({ initial: { chainId, safeAddress: safeA }, pollSafeInfo: false })
    expect(mockScopeProps).toHaveBeenCalledWith({ initial: { chainId, safeAddress: safeB }, pollSafeInfo: false })
  })

  it('loads the next page by its cursor and merges a run that continues on it', () => {
    const cursor = 'limit=20&offset=20'
    mockPages({
      '': page([run(chainId, safeA, 2)], {
        next: `http://cgw.test/v1/spaces/${spaceId}/transactions/queued?cursor=${encodeURIComponent(cursor)}`,
      }),
      [cursor]: page([run(chainId, safeA, 3)]),
    })

    render(<SpaceTransactionQueue spaceId={spaceId} />)
    fireEvent.click(screen.getByText('load more'))

    expect(mockQuery).toHaveBeenCalledWith({ spaceId, cursor })
    expect(screen.getAllByTestId('space-queue-safe-run')).toHaveLength(1)
    expect(screen.getByTestId('tx-list')).toHaveTextContent(`5 items of ${chainId}:${safeA}`)
    expect(screen.queryByText('load more')).not.toBeInTheDocument()
  })

  it('shows the empty state when no Safe has pending transactions', () => {
    mockPages({ '': page([]) })

    render(<SpaceTransactionQueue spaceId={spaceId} />)

    expect(screen.getByText('Pending transactions of your Safe accounts will appear here')).toBeInTheDocument()
  })

  it('tells how many Safes could not be loaded', () => {
    mockPages({
      '': page([], {
        unavailableSafes: [
          { chainId, safeAddress: safeA },
          { chainId, safeAddress: safeB },
        ],
      }),
    })

    render(<SpaceTransactionQueue spaceId={spaceId} />)

    expect(
      screen.getByText("2 Safe accounts couldn't be loaded, so their transactions aren't shown."),
    ).toBeInTheDocument()
  })

  it('shows an error when the queue fails to load', () => {
    mockQuery.mockReturnValue({ currentData: undefined, isError: true })

    render(<SpaceTransactionQueue spaceId={spaceId} />)

    expect(screen.getByText('Error loading transactions')).toBeInTheDocument()
    expect(screen.queryByTestId('space-queue-safe-run')).not.toBeInTheDocument()
  })
})
