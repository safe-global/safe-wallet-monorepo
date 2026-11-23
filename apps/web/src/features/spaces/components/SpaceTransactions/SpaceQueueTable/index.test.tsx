import { faker } from '@faker-js/faker'
import { useEffect, type ReactNode } from 'react'
import { http, HttpResponse } from 'msw'
import { GATEWAY_URL } from '@/config/gateway'
import * as useWallet from '@/hooks/wallets/useWallet'
import type { RootState } from '@/store'
import { connectedWalletBuilder } from '@/tests/builders/wallet'
import { server } from '@/tests/server'
import { fakerChecksummedAddress, fireEvent, render, screen } from '@/tests/test-utils'
import { setBaseUrl } from '@safe-global/store/gateway/cgwClient'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { executionInfoBuilder, safeTxSummaryBuilder } from '@/tests/builders/safeTx'
import type { SpaceQueueChain, SpaceQueueSection } from '../../../hooks/useSpaceQueue'
import SpaceQueueTable from '.'
import { DeleteTxDialogProvider } from '../RowActionsMenu/DeleteTxDialog'
import { Table, TableBody } from '@safe-global/views/components/ui/table'
import type SpaceQueueRowType from '../SpaceQueueRow'
import {
  QUEUE_COLUMN_WIDTHS,
  QUEUE_COLUMNS,
  QUEUE_TABLE_MIN_WIDTH,
} from '@safe-global/views/features/spaces/components/SpaceQueue/columns'

const mockChainNames: Record<string, string> = {}
const mockScopeProps = jest.fn()
const mockScopeMounts = jest.fn()
jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({
    configs: Object.entries(mockChainNames).map(([chainId, chainName]) => ({ chainId, chainName, shortName: chainId })),
    loading: false,
  }),
  useCurrentChain: () => undefined,
  useHasFeature: () => false,
  useChain: () => undefined,
}))
jest.mock('@/components/tx-flow/safe-scope/SafeScopeProvider', () => ({
  SafeScopeProvider: (props: { initial: unknown; pollSafeInfo: boolean; children: ReactNode }) => {
    mockScopeProps({ initial: props.initial, pollSafeInfo: props.pollSafeInfo })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => mockScopeMounts(props.initial), [])
    return <>{props.children}</>
  },
}))
jest.mock('../SpaceQueueRow', () => ({
  __esModule: true,
  default: ({
    item,
    status,
    chainId,
    safeAddress,
  }: {
    item: TransactionQueuedItem
    status: string
    chainId: string
    safeAddress: string
  }) => (
    <tr data-testid="space-queue-row">
      <td>
        {item.transaction.id} {status} {chainId} of {safeAddress}
      </td>
    </tr>
  ),
}))
jest.mock('@/hooks/useSafeDisplayName', () => ({ useSafeDisplayName: () => '' }))
jest.mock('@/components/transactions/TxSummary/QueueActions', () => ({ __esModule: true, default: () => null }))

const signedIn: RootState['auth'] = {
  sessionExpiresAt: Date.now() + 60 * 60 * 1000,
  landingSpaceHint: null,
  isStoreHydrated: true,
  cfSafeSynced: false,
  isOidcLoginPending: false,
  isSessionCheckPending: false,
}

const transactionItem = (
  txStatus: Transaction['txStatus'],
  nonce: number,
  conflictType: TransactionQueuedItem['conflictType'] = 'None',
  missingSigners: string[] = [],
): TransactionQueuedItem => ({
  type: 'TRANSACTION',
  conflictType,
  transaction: safeTxSummaryBuilder()
    .with({
      txStatus,
      timestamp: faker.date.past().getTime(),
      executionInfo: executionInfoBuilder()
        .with({ nonce, missingSigners: missingSigners.map((value) => ({ value })) })
        .build(),
    })
    .build(),
})

const section = (safeAddress: string, chains: SpaceQueueChain[]): SpaceQueueSection => ({ safeAddress, chains })

const renderedRows = () => screen.queryAllByTestId('space-queue-row')

const stubRowHeights = (): void => {
  jest
    .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    .mockReturnValue({ height: 56, width: 1240, top: 0, left: 0, right: 1240, bottom: 56, x: 0, y: 0 } as DOMRect)
}

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
    mockScopeMounts.mockClear()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders a band per Safe and its rows inside the Safe scope, without polling', () => {
    render(<SpaceQueueTable sections={sections} groupBy="safe" />)

    expect(screen.getByText(shortenAddress(safeA))).toBeInTheDocument()
    expect(screen.getByText(shortenAddress(safeB))).toBeInTheDocument()
    expect(screen.getByText(`${next.transaction.id} execute ${chainId} of ${safeA}`)).toBeInTheDocument()
    expect(screen.getByText(`${queued.transaction.id} blocked ${chainId} of ${safeA}`)).toBeInTheDocument()
    expect(mockScopeProps).toHaveBeenCalledWith({ initial: { chainId, safeAddress: safeA }, pollSafeInfo: false })
    expect(mockScopeProps).toHaveBeenCalledWith({ initial: { chainId, safeAddress: safeB }, pollSafeInfo: false })
  })

  it.each(['safe', 'status', 'next', 'network'] as const)(
    'titles every column visibly, in layout B order, when grouped by %s',
    (groupBy) => {
      render(<SpaceQueueTable sections={sections} groupBy={groupBy} />)

      const headers = screen.getAllByRole('columnheader').slice(0, 5)
      expect(headers.map((header) => header.textContent)).toEqual(['Nonce', 'Safe', 'Transaction', 'Details', 'Status'])
      headers.forEach((header) => expect(header.querySelector('.sr-only')).toBeNull())
      expect(screen.getAllByRole('columnheader')).toHaveLength(6)
      expect(screen.queryByRole('columnheader', { name: 'Note' })).not.toBeInTheDocument()
    },
  )

  it.each(['safe', 'status', 'next', 'network'] as const)(
    'keeps the same column widths and floor when grouped by %s',
    (groupBy) => {
      const { container } = render(<SpaceQueueTable sections={sections} groupBy={groupBy} />)

      expect(container.querySelector('table')).toHaveClass(QUEUE_TABLE_MIN_WIDTH)
      expect([...container.querySelectorAll('col')].map((col) => col.style.width)).toEqual(
        QUEUE_COLUMNS.map((column) => {
          const width = QUEUE_COLUMN_WIDTHS[column]
          return width === undefined ? '' : `${width}px`
        }),
      )
    },
  )

  it("renders each chain of a multichain Safe in that chain's scope, with its own Next", () => {
    render(<SpaceQueueTable sections={[multichain]} groupBy="safe" />)

    expect(screen.getByText(`${onChainA.transaction.id} execute ${chainId} of ${safeA}`)).toBeInTheDocument()
    expect(screen.getByText(`${onChainB.transaction.id} execute ${otherChainId} of ${safeA}`)).toBeInTheDocument()
    expect(mockScopeProps).toHaveBeenCalledWith({ initial: { chainId, safeAddress: safeA }, pollSafeInfo: false })
    expect(mockScopeProps).toHaveBeenCalledWith({
      initial: { chainId: otherChainId, safeAddress: safeA },
      pollSafeInfo: false,
    })
  })

  it('puts a header row per chain with the chain name and the nonce of its next transaction', () => {
    render(<SpaceQueueTable sections={[multichain]} groupBy="safe" />)

    expect(screen.getByText(chainName).closest('tr')).toHaveTextContent(`${chainName}Next #7`)
    expect(screen.getByText(otherChainName).closest('tr')).toHaveTextContent(`${otherChainName}Next #2`)
  })

  it('omits the next nonce from a chain header when no transaction is next', () => {
    render(<SpaceQueueTable sections={[section(safeA, [{ chainId, items: [queued] }])]} groupBy="safe" />)

    expect(screen.getByText(chainName).closest('tr')).not.toHaveTextContent('Next #')
  })

  it("collapses only that chain's rows from its header", () => {
    render(<SpaceQueueTable sections={[multichain]} groupBy="safe" />)

    fireEvent.click(screen.getByRole('button', { name: `Collapse ${chainName}` }))

    expect(screen.queryByText(`${onChainA.transaction.id} execute ${chainId} of ${safeA}`)).not.toBeInTheDocument()
    expect(screen.getByText(`${onChainB.transaction.id} execute ${otherChainId} of ${safeA}`)).toBeInTheDocument()
    expect(screen.getByText(chainName)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: `Expand ${chainName}` })).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(screen.getByRole('button', { name: `Expand ${chainName}` }))

    expect(screen.getByText(`${onChainA.transaction.id} execute ${chainId} of ${safeA}`)).toBeInTheDocument()
  })

  it('hides every chain of a collapsed Safe, headers included', () => {
    render(<SpaceQueueTable sections={[multichain]} groupBy="safe" />)

    fireEvent.click(screen.getByRole('button', { name: `Collapse ${shortenAddress(safeA)}` }))

    expect(screen.queryByText(chainName)).not.toBeInTheDocument()
    expect(screen.queryByText(otherChainName)).not.toBeInTheDocument()
    expect(renderedRows()).toHaveLength(0)
  })

  it('collapses one Safe and summarises its transactions in the band', () => {
    render(<SpaceQueueTable sections={sections} groupBy="safe" />)

    fireEvent.click(screen.getByRole('button', { name: `Collapse ${shortenAddress(safeA)}` }))

    expect(screen.queryByText(`${next.transaction.id} execute ${chainId} of ${safeA}`)).not.toBeInTheDocument()
    expect(screen.getByText('1 to execute · 1 blocked')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: `Expand ${shortenAddress(safeA)}` })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    expect(renderedRows()).toHaveLength(1)
  })

  it('collapses and expands every Safe from the column header', () => {
    render(<SpaceQueueTable sections={sections} groupBy="safe" />)

    fireEvent.click(screen.getByRole('button', { name: 'Collapse all' }))

    expect(renderedRows()).toHaveLength(0)

    fireEvent.click(screen.getByRole('button', { name: 'Expand all' }))

    expect(renderedRows()).toHaveLength(3)
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

    render(<SpaceQueueTable sections={[conflicting]} groupBy="safe" />)

    expect(screen.getByText('Conflicting').closest('tr')).toHaveTextContent(/^5Conflicting/)
    expect(screen.getByText(/Only 1\/2 transactions can execute/)).toBeInTheDocument()
    expect(screen.getAllByTestId('space-queue-row')).toHaveLength(2)
  })

  it('renders only the rows near the viewport of a long queue', () => {
    stubRowHeights()
    const items: TransactionQueuedItem[] = Array.from({ length: 300 }, (_, nonce) =>
      transactionItem('AWAITING_CONFIRMATIONS', nonce),
    )

    render(<SpaceQueueTable sections={[section(safeA, [{ chainId, items }])]} groupBy="safe" />)

    const rendered = renderedRows().length
    expect(rendered).toBeGreaterThan(0)
    expect(rendered).toBeLessThan(60)
    expect(screen.getByTestId('space-queue-skeleton')).toBeInTheDocument()
  })

  it('has no Show more', () => {
    render(<SpaceQueueTable sections={sections} groupBy="safe" />)

    expect(screen.queryByRole('button', { name: 'Show more' })).not.toBeInTheDocument()
  })

  describe('grouped by status', () => {
    const waitingOnB = transactionItem('AWAITING_CONFIRMATIONS', 9)
    const interleaved = [
      section(safeA, [
        { chainId, items: [{ type: 'LABEL', label: 'Next' }, next, { type: 'LABEL', label: 'Queued' }, queued] },
      ]),
      section(safeB, [{ chainId, items: [{ type: 'LABEL', label: 'Next' }, waitingOnB] }]),
    ]

    it('lists the transactions by urgency without bands, each naming its Safe', () => {
      render(<SpaceQueueTable sections={interleaved} groupBy="status" />)

      expect(screen.queryByTestId('space-queue-safe')).not.toBeInTheDocument()
      expect(renderedRows().map((row) => row.textContent)).toEqual([
        `${next.transaction.id} execute ${chainId} of ${safeA}`,
        `${waitingOnB.transaction.id} waiting ${chainId} of ${safeB}`,
        `${queued.transaction.id} blocked ${chainId} of ${safeA}`,
      ])
    })

    it("loads each Safe's scope once, however its rows interleave with another Safe's", () => {
      render(<SpaceQueueTable sections={interleaved} groupBy="status" />)

      expect(mockScopeMounts).toHaveBeenCalledTimes(2)
      expect(mockScopeMounts).toHaveBeenCalledWith({ chainId, safeAddress: safeA })
      expect(mockScopeMounts).toHaveBeenCalledWith({ chainId, safeAddress: safeB })
    })

    it('has nothing to collapse', () => {
      render(<SpaceQueueTable sections={interleaved} groupBy="status" />)

      expect(screen.queryByRole('button', { name: 'Collapse all' })).not.toBeInTheDocument()
    })

    describe('to sign', () => {
      const awaitingSignature = (signer: string) =>
        transactionItem('AWAITING_CONFIRMATIONS', faker.number.int({ max: 100 }), 'None', [signer])
      const queueOf = (waiting: TransactionQueuedItem, toSign: TransactionQueuedItem) => [
        section(safeB, [{ chainId, items: [{ type: 'LABEL', label: 'Next' }, waiting] }]),
        section(safeA, [{ chainId, items: [{ type: 'LABEL', label: 'Next' }, toSign] }]),
      ]

      beforeEach(() => {
        setBaseUrl(GATEWAY_URL)
      })

      it("lists first a transaction a wallet linked to the signed-in user still has to sign, while it isn't connected", async () => {
        const linked = fakerChecksummedAddress()
        server.use(
          http.get(`${GATEWAY_URL}/v1/users`, () =>
            HttpResponse.json({
              id: faker.number.int(),
              status: 1,
              wallets: [{ id: faker.number.int(), address: linked }],
            }),
          ),
        )
        const waiting = awaitingSignature(fakerChecksummedAddress())
        const toSign = awaitingSignature(linked)

        render(<SpaceQueueTable sections={queueOf(waiting, toSign)} groupBy="status" />, {
          initialReduxState: { auth: signedIn },
        })

        expect(await screen.findByText(`${toSign.transaction.id} sign ${chainId} of ${safeA}`)).toBeInTheDocument()
        expect(renderedRows().map((row) => row.textContent)).toEqual([
          `${toSign.transaction.id} sign ${chainId} of ${safeA}`,
          `${waiting.transaction.id} waiting ${chainId} of ${safeB}`,
        ])
      })

      it("lists first a transaction the connected wallet still has to sign, while it isn't linked", () => {
        const connected = fakerChecksummedAddress()
        jest.spyOn(useWallet, 'default').mockReturnValue(connectedWalletBuilder().with({ address: connected }).build())
        const waiting = awaitingSignature(fakerChecksummedAddress())
        const toSign = awaitingSignature(connected)

        render(<SpaceQueueTable sections={queueOf(waiting, toSign)} groupBy="status" />)

        expect(renderedRows().map((row) => row.textContent)).toEqual([
          `${toSign.transaction.id} sign ${chainId} of ${safeA}`,
          `${waiting.transaction.id} waiting ${chainId} of ${safeB}`,
        ])
      })
    })
  })

  describe('grouped by network', () => {
    it('puts the rows of each network under a band with its name and transaction count', () => {
      render(<SpaceQueueTable sections={[multichain]} groupBy="network" />)

      expect(screen.getByText(chainName).closest('tr')).toHaveTextContent(`${chainName}1`)
      expect(screen.getByText(otherChainName).closest('tr')).toHaveTextContent(`${otherChainName}1`)
      expect(screen.getByText(`${onChainA.transaction.id} execute ${chainId} of ${safeA}`)).toBeInTheDocument()
    })

    it("collapses only that network's rows from its band", () => {
      render(<SpaceQueueTable sections={[multichain]} groupBy="network" />)

      fireEvent.click(screen.getByRole('button', { name: `Collapse ${chainName}` }))

      expect(renderedRows().map((row) => row.textContent)).toEqual([
        `${onChainB.transaction.id} execute ${otherChainId} of ${safeA}`,
      ])
      expect(screen.getByRole('button', { name: `Expand ${chainName}` })).toHaveAttribute('aria-expanded', 'false')
    })

    it('collapses and expands every network from the column header', () => {
      render(<SpaceQueueTable sections={[multichain]} groupBy="network" />)

      fireEvent.click(screen.getByRole('button', { name: 'Collapse all' }))

      expect(renderedRows()).toHaveLength(0)
      expect(screen.getByRole('button', { name: 'Expand all' })).toHaveTextContent('Expand 2 networks')

      fireEvent.click(screen.getByRole('button', { name: 'Expand all' }))

      expect(renderedRows()).toHaveLength(2)
    })
  })

  describe('grouped by up next', () => {
    it("separates each Safe's next transaction from those behind it", () => {
      render(<SpaceQueueTable sections={sections} groupBy="next" />)

      expect(screen.getByText('Next in line').closest('tr')).toHaveTextContent('Next in line2')
      expect(screen.getByText('Behind it').closest('tr')).toHaveTextContent('Behind it1')
      expect(renderedRows().at(-1)).toHaveTextContent(`${queued.transaction.id} blocked ${chainId} of ${safeA}`)
    })
  })

  describe('rows', () => {
    const { default: SpaceQueueRow } = jest.requireActual<{ default: typeof SpaceQueueRowType }>('../SpaceQueueRow')

    it('are not expandable', () => {
      render(
        <DeleteTxDialogProvider>
          <Table>
            <TableBody>
              <SpaceQueueRow item={next} safeAddress={safeA} chainId={chainId} status="execute" />
            </TableBody>
          </Table>
        </DeleteTxDialogProvider>,
      )
      const row = screen.getByTestId('space-queue-row')

      fireEvent.click(row)

      expect(row).not.toHaveAttribute('aria-expanded')
      expect(screen.queryByTestId('space-queue-row-details')).not.toBeInTheDocument()
    })

    const renderRow = (item: TransactionQueuedItem) =>
      render(
        <DeleteTxDialogProvider>
          <Table>
            <TableBody>
              <SpaceQueueRow item={item} safeAddress={safeA} chainId={chainId} status="execute" />
            </TableBody>
          </Table>
        </DeleteTxDialogProvider>,
      )

    it('fills one cell per column, with the Safe in its own column', () => {
      renderRow(next)

      const cells = screen.getByTestId('space-queue-row').querySelectorAll('td')
      expect(cells).toHaveLength(6)
      expect(cells[1]).toHaveTextContent(shortenAddress(safeA, 3))
    })
  })
})
