import { faker } from '@faker-js/faker'
import { useEffect, type ReactNode } from 'react'
import { http, HttpResponse } from 'msw'
import { GATEWAY_URL } from '@/config/gateway'
import * as useWallet from '@/hooks/wallets/useWallet'
import type { RootState } from '@/store'
import { connectedWalletBuilder } from '@/tests/builders/wallet'
import { server } from '@/tests/server'
import { useState } from 'react'
import {
  act,
  advanceClock,
  fakerChecksummedAddress,
  fireEvent,
  render,
  renderOnFakeClock,
  renderWithUserEvent,
  screen,
  within,
} from '@/tests/test-utils'
import local from '@/services/local-storage/local'
import { getStoreInstance } from '@/store'
import { setQueueCollapseAll, spaceQueueViewSlice } from '../../../public/store/spaceQueueViewSlice'
import { PendingStatus, PendingTxType } from '@/store/pendingTxsSlice'
import { setBaseUrl } from '@safe-global/store/gateway/cgwClient'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { QueueStatus } from '@safe-global/views/features/spaces/components/SpaceQueue/types'
import { QUEUE_TOOLTIP_DELAY } from '@safe-global/views/features/spaces/components/SpaceQueue/tooltip'
import { executionInfoBuilder, safeTxSummaryBuilder } from '@/tests/builders/safeTx'
import type { SpaceQueueChain, SpaceQueueSection } from '../../../hooks/useSpaceQueue'
import SpaceQueueTable from '.'
import { buildGroupedQueueList, buildQueueList } from './queueList'
import { createHighlightStore, QueueNavigationContext } from './queueNavigation'
import { DeleteTxDialogProvider } from '../RowActionsMenu/DeleteTxDialog'
import { Table, TableBody } from '@safe-global/views/components/ui/table'
import type SpaceQueueRowType from '../SpaceQueueRow'
import {
  QUEUE_COLUMN_WIDTHS,
  QUEUE_COLUMNS,
  QUEUE_TABLE_MIN_WIDTH,
} from '@safe-global/views/features/spaces/components/SpaceQueue/columns'

const mockIsMobile = jest.fn(() => false)
jest.mock('@safe-global/views/hooks/use-mobile', () => ({ useIsMobile: () => mockIsMobile() }))

jest.mock('./queueList', () => {
  const actual = jest.requireActual('./queueList')
  return {
    ...actual,
    buildQueueList: jest.fn(actual.buildQueueList),
    buildGroupedQueueList: jest.fn(actual.buildGroupedQueueList),
  }
})

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
const mockScrollToIndex = jest.fn()
jest.mock('@tanstack/react-virtual', () => {
  const actual = jest.requireActual('@tanstack/react-virtual')
  return {
    ...actual,
    useWindowVirtualizer: (options: unknown) => {
      const virtualizer = actual.useWindowVirtualizer(options)
      virtualizer.scrollToIndex = mockScrollToIndex
      return virtualizer
    },
  }
})
jest.mock('../SpaceQueueRow', () => ({
  __esModule: true,
  default: function MockRow({
    item,
    status,
    chainId,
    safeAddress,
    nextNonce,
    nextStatus,
    compact,
  }: {
    item: TransactionQueuedItem
    status: string
    chainId: string
    safeAddress: string
    nextNonce?: number
    nextStatus?: string
    compact?: boolean
  }) {
    const navigation = jest.requireActual('./queueNavigation')
    const goTo = navigation.useQueueGoTo()
    const { phase } = navigation.useRowHighlight(item.transaction.id)
    return (
      <tr data-testid="space-queue-row" data-highlighted={phase} data-compact={compact}>
        <td>
          {item.transaction.id} {status} {chainId} of {safeAddress}
        </td>
        {status === 'blocked' && nextNonce !== undefined && (
          <td>
            <button
              aria-label={`Go from ${item.transaction.id}`}
              onClick={() => goTo({ safeAddress, chainId, nonce: nextNonce, status: nextStatus })}
            />
          </td>
        )}
      </tr>
    )
  },
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
    mockIsMobile.mockReturnValue(false)
  })

  afterEach(() => {
    jest.restoreAllMocks()
    // The Collapse all / Expand all pick is saved to localStorage and read back by the next render
    localStorage.clear()
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

  it("opens the tooltips of the shared components it renders after the queue's delay", async () => {
    jest.useFakeTimers()
    try {
      const { user } = renderOnFakeClock(<SpaceQueueTable sections={[sections[0]]} groupBy="safe" />)

      await user.hover(screen.getByRole('button', { name: `Show ${chainName}` }))
      await advanceClock(QUEUE_TOOLTIP_DELAY - 50)
      expect(screen.queryByText(chainName, { selector: '[data-slot="tooltip-content"]' })).not.toBeInTheDocument()

      await advanceClock(100)
      expect(screen.getByText(chainName, { selector: '[data-slot="tooltip-content"]' })).toBeInTheDocument()
    } finally {
      jest.useRealTimers()
    }
  })

  it("gives each network of a Safe's band its own logo button and tooltip", async () => {
    const { user } = renderWithUserEvent(<SpaceQueueTable sections={[multichain]} groupBy="safe" />)

    const other = screen.getByRole('button', { name: `Show ${otherChainName}` })
    expect(other).toHaveAttribute('aria-expanded', 'true')
    await user.hover(other)
    expect(await screen.findByText(otherChainName, { selector: '[data-slot="tooltip-content"]' })).toBeInTheDocument()
  })

  it('shows only the network whose logo is clicked, then every network on a second click', async () => {
    render(<SpaceQueueTable sections={[multichain]} groupBy="safe" />)

    fireEvent.click(screen.getByRole('button', { name: `Show ${otherChainName}` }))

    expect(screen.queryByText(`${onChainA.transaction.id} execute ${chainId} of ${safeA}`)).not.toBeInTheDocument()
    expect(screen.getByText(`${onChainB.transaction.id} execute ${otherChainId} of ${safeA}`)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: `Show ${chainName}` })).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(screen.getByRole('button', { name: 'Show all 2 networks' }))

    expect(screen.getByText(`${onChainA.transaction.id} execute ${chainId} of ${safeA}`)).toBeInTheDocument()
    expect(screen.getByText(`${onChainB.transaction.id} execute ${otherChainId} of ${safeA}`)).toBeInTheDocument()
  })

  it("opens the Safe's card on focus, with its address, networks and next nonces", async () => {
    render(<SpaceQueueTable sections={[multichain]} groupBy="safe" />)

    act(() => screen.getByTestId('safe-band-identity').focus())

    expect(await screen.findByText(safeA)).toHaveClass('font-mono')
    expect(screen.getByText(`${chainName}, ${otherChainName}`)).toBeInTheDocument()
    expect(screen.getByText(`#7 on ${chainName}, #2 on ${otherChainName}`)).toHaveClass('font-mono')
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

  it('pins the Nonce and Action headers, and lets the panel scroll a narrow table without widening the page', () => {
    const { container } = render(<SpaceQueueTable sections={sections} groupBy="safe" />)

    const headers = screen.getAllByRole('columnheader')
    expect(headers[0]).toHaveAttribute('data-pin', 'start')
    expect(headers[5]).toHaveAttribute('data-pin', 'end')
    expect(container.querySelector('table')?.parentElement).toHaveClass('overflow-x-auto', '@container')
    renderedRows().forEach((row) => expect(row).toHaveAttribute('data-compact', 'false'))
  })

  it('turns the pins on only while the table is wider than its panel', () => {
    const widths = { scrollWidth: 960, clientWidth: 1000 }
    jest.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(() => widths.scrollWidth)
    jest.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => widths.clientWidth)
    const { container, unmount } = render(<SpaceQueueTable sections={sections} groupBy="safe" />)
    expect(container.querySelector('table')?.parentElement).not.toHaveAttribute('data-scrolls-x')
    unmount()

    widths.clientWidth = 720
    const narrow = render(<SpaceQueueTable sections={sections} groupBy="safe" />)
    expect(narrow.container.querySelector('table')?.parentElement).toHaveAttribute('data-scrolls-x')
  })

  describe('below the mobile breakpoint', () => {
    beforeEach(() => mockIsMobile.mockReturnValue(true))

    it.each(['safe', 'status', 'next', 'network'] as const)(
      'drops the floor and the fixed widths but the nonce, grouped by %s',
      (groupBy) => {
        const { container } = render(<SpaceQueueTable sections={sections} groupBy={groupBy} />)

        expect(container.querySelector('table')).not.toHaveClass(QUEUE_TABLE_MIN_WIDTH)
        expect([...container.querySelectorAll('col')].map((col) => col.style.width)).toEqual([
          `${QUEUE_COLUMN_WIDTHS.Nonce}px`,
          '',
          '',
          '',
          '',
          '',
        ])
        expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
          'Nonce',
          expect.stringMatching(/^Transaction/),
        ])
        expect(renderedRows().length).toBeGreaterThan(0)
        renderedRows().forEach((row) => expect(row).toHaveAttribute('data-compact', 'true'))
      },
    )

    it('keeps the Safe bands and Collapse all', () => {
      render(<SpaceQueueTable sections={sections} groupBy="safe" />)

      expect(screen.getAllByTestId('space-queue-safe')).toHaveLength(2)
      expect(screen.getByRole('button', { name: 'Collapse all' })).toHaveTextContent('')
      fireEvent.click(screen.getByRole('button', { name: 'Collapse all' }))
      expect(renderedRows()).toHaveLength(0)
      fireEvent.click(screen.getByRole('button', { name: 'Expand all' }))
      expect(renderedRows()).toHaveLength(3)
    })
  })

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

  describe('saved Collapse all / Expand all', () => {
    const saveView = (view: { groupBy?: string; collapseAll?: boolean }) =>
      local.setItem(spaceQueueViewSlice.name, { groupBy: 'safe', ...view })
    const savedView = () => local.getItem(spaceQueueViewSlice.name)

    it('saves Collapse all, so the queue opens collapsed after a reload', () => {
      const { unmount } = render(<SpaceQueueTable sections={sections} groupBy="safe" />)
      fireEvent.click(screen.getByRole('button', { name: 'Collapse all' }))
      expect(savedView()).toMatchObject({ collapseAll: true })
      unmount()

      render(<SpaceQueueTable sections={sections} groupBy="safe" />)

      expect(renderedRows()).toHaveLength(0)
      expect(screen.getByRole('button', { name: 'Expand all' })).toBeInTheDocument()
    })

    it('saves Expand all, so the queue opens expanded after a reload', () => {
      saveView({ collapseAll: true })
      const { unmount } = render(<SpaceQueueTable sections={sections} groupBy="safe" />)
      fireEvent.click(screen.getByRole('button', { name: 'Expand all' }))
      expect(savedView()).toMatchObject({ collapseAll: false })
      unmount()

      render(<SpaceQueueTable sections={sections} groupBy="safe" />)

      expect(renderedRows()).toHaveLength(3)
    })

    it('expands one Safe after Collapse all without saving it, so a reload collapses it again', () => {
      saveView({ collapseAll: true })
      const { unmount } = render(<SpaceQueueTable sections={sections} groupBy="safe" />)

      fireEvent.click(screen.getByRole('button', { name: `Expand ${shortenAddress(safeB)}` }))

      expect(renderedRows()).toHaveLength(1)
      expect(screen.getByRole('button', { name: `Collapse ${shortenAddress(safeB)}` })).toBeInTheDocument()
      expect(savedView()).toMatchObject({ collapseAll: true })
      unmount()

      render(<SpaceQueueTable sections={sections} groupBy="safe" />)

      expect(renderedRows()).toHaveLength(0)
    })

    it('does not save collapsing a single network band, so a reload expands it again', () => {
      const { unmount } = render(<SpaceQueueTable sections={[multichain]} groupBy="network" />)

      fireEvent.click(screen.getByRole('button', { name: `Collapse ${chainName}` }))

      expect(renderedRows()).toHaveLength(1)
      expect(savedView()).toBeNull()
      unmount()

      render(<SpaceQueueTable sections={[multichain]} groupBy="network" />)

      expect(renderedRows()).toHaveLength(2)
    })

    it('drops the one-by-one toggles on Collapse all, collapsing every Safe', () => {
      render(<SpaceQueueTable sections={sections} groupBy="safe" />)
      fireEvent.click(screen.getByRole('button', { name: `Collapse ${shortenAddress(safeA)}` }))

      fireEvent.click(screen.getByRole('button', { name: 'Collapse all' }))

      expect(renderedRows()).toHaveLength(0)
      fireEvent.click(screen.getByRole('button', { name: 'Expand all' }))
      expect(renderedRows()).toHaveLength(3)
    })

    it('follows a Collapse all made in another tab', () => {
      render(<SpaceQueueTable sections={[multichain]} groupBy="network" />)
      fireEvent.click(screen.getByRole('button', { name: `Collapse ${chainName}` }))

      act(() => {
        getStoreInstance().dispatch(setQueueCollapseAll(true))
      })

      expect(renderedRows()).toHaveLength(0)
      expect(screen.getByRole('button', { name: 'Expand all' })).toHaveTextContent('Expand 2 networks')
    })

    it('applies the saved pick to the grouping on screen', () => {
      saveView({ groupBy: 'network', collapseAll: true })

      render(<SpaceQueueTable sections={[multichain]} groupBy="network" />)

      expect(renderedRows()).toHaveLength(0)
    })

    describe('re-rendering with Collapse all saved', () => {
      const multichainSections = [multichain]
      // Re-renders the table with the same props, as a scroll of the virtualizer does
      const Rerenderer = ({ groupBy }: { groupBy: 'safe' | 'network' }) => {
        const [count, setCount] = useState(0)
        return (
          <>
            <button onClick={() => setCount(count + 1)}>Rerender</button>
            <SpaceQueueTable sections={groupBy === 'safe' ? sections : multichainSections} groupBy={groupBy} />
          </>
        )
      }

      it.each([
        ['network', buildGroupedQueueList],
        ['safe', buildQueueList],
      ] as const)('reuses the rows when grouped by %s', (groupBy, build) => {
        saveView({ groupBy, collapseAll: true })
        render(<Rerenderer groupBy={groupBy} />)
        const calls = jest.mocked(build).mock.calls.length

        fireEvent.click(screen.getByRole('button', { name: 'Rerender' }))

        expect(jest.mocked(build).mock.calls.length).toBe(calls)
      })
    })

    it('lists every transaction when grouped by status, which has no Collapse all', () => {
      saveView({ groupBy: 'status', collapseAll: true })

      render(<SpaceQueueTable sections={sections} groupBy="status" />)

      expect(renderedRows()).toHaveLength(3)
      expect(screen.queryByRole('button', { name: /all$/ })).not.toBeInTheDocument()
    })
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

  describe('Blocked by', () => {
    const blockerOnB = transactionItem('AWAITING_EXECUTION', 3)
    const blockerOnOtherChain = transactionItem('AWAITING_EXECUTION', 3)
    const blocker = transactionItem('AWAITING_EXECUTION', 3)
    const blocked = transactionItem('AWAITING_EXECUTION', 4)
    // The same nonce on another Safe and on another chain of the same Safe come first
    const sameNonceElsewhere = [
      section(safeB, [{ chainId, items: [{ type: 'LABEL', label: 'Next' }, blockerOnB] }]),
      section(safeA, [
        { chainId: otherChainId, items: [{ type: 'LABEL', label: 'Next' }, blockerOnOtherChain] },
        { chainId, items: [{ type: 'LABEL', label: 'Next' }, blocker, { type: 'LABEL', label: 'Queued' }, blocked] },
      ]),
    ]
    const rowOf = (item: TransactionQueuedItem) =>
      renderedRows().find((row) => row.textContent?.startsWith(item.transaction.id))
    const goFromBlocked = () =>
      fireEvent.click(screen.getByRole('button', { name: `Go from ${blocked.transaction.id}` }))

    beforeEach(() => mockScrollToIndex.mockClear())
    afterEach(() => jest.useRealTimers())

    it('scrolls to the transaction of that Safe and chain, not just that nonce, and highlights it', () => {
      render(<SpaceQueueTable sections={sameNonceElsewhere} groupBy="safe" />)

      goFromBlocked()

      // Safe B band, its chain, its #3, Safe A band, its other chain, that chain's #3, the chain, then the blocker
      expect(mockScrollToIndex).toHaveBeenCalledTimes(1)
      expect(mockScrollToIndex).toHaveBeenCalledWith(7, { align: 'center', behavior: 'smooth' })
      expect(rowOf(blocker)).toHaveAttribute('data-highlighted', 'on')
      expect(rowOf(blockerOnB)).not.toHaveAttribute('data-highlighted')
      expect(rowOf(blockerOnOtherChain)).not.toHaveAttribute('data-highlighted')
    })

    it('goes to the blocker the same way in the compact list', () => {
      mockIsMobile.mockReturnValue(true)
      render(<SpaceQueueTable sections={sameNonceElsewhere} groupBy="safe" />)

      goFromBlocked()

      expect(mockScrollToIndex).toHaveBeenCalledWith(7, { align: 'center', behavior: 'smooth' })
      expect(rowOf(blocker)).toHaveAttribute('data-highlighted', 'on')
      expect(rowOf(blocker)).toHaveAttribute('data-compact', 'true')
    })

    it('fades the highlight out after two seconds', () => {
      jest.useFakeTimers()
      render(<SpaceQueueTable sections={sameNonceElsewhere} groupBy="safe" />)

      goFromBlocked()
      act(() => jest.advanceTimersByTime(2000))
      expect(rowOf(blocker)).toHaveAttribute('data-highlighted', 'fading')

      act(() => jest.advanceTimersByTime(700))
      expect(rowOf(blocker)).not.toHaveAttribute('data-highlighted')
    })

    it('jumps without the smooth scroll when the user prefers reduced motion', () => {
      jest
        .spyOn(window, 'matchMedia')
        .mockImplementation((query) => ({ matches: query === '(prefers-reduced-motion: reduce)' }) as MediaQueryList)
      render(<SpaceQueueTable sections={sameNonceElsewhere} groupBy="safe" />)

      goFromBlocked()

      expect(mockScrollToIndex).toHaveBeenCalledWith(7, { align: 'center', behavior: 'auto' })
    })

    it('goes to the option the hint is about when transactions share the nonce', () => {
      const first = transactionItem('AWAITING_CONFIRMATIONS', 3, 'HasNext')
      const second = transactionItem('AWAITING_EXECUTION', 3, 'End')
      render(
        <SpaceQueueTable
          sections={[
            section(safeA, [
              {
                chainId,
                items: [
                  { type: 'LABEL', label: 'Next' },
                  { type: 'CONFLICT_HEADER', nonce: 3 },
                  first,
                  second,
                  { type: 'LABEL', label: 'Queued' },
                  blocked,
                ],
              },
            ]),
          ]}
          groupBy="safe"
        />,
      )

      goFromBlocked()

      // The Safe band, the chain, the conflict header, the first option, then the second, which can execute
      expect(mockScrollToIndex).toHaveBeenCalledWith(4, expect.anything())
      expect(rowOf(second)).toHaveAttribute('data-highlighted', 'on')
      expect(rowOf(first)).not.toHaveAttribute('data-highlighted')
    })

    it('expands the collapsed band holding the transaction, without changing the saved Collapse all', () => {
      render(<SpaceQueueTable sections={sameNonceElsewhere} groupBy="next" />)
      fireEvent.click(screen.getByRole('button', { name: 'Collapse all' }))
      fireEvent.click(screen.getByRole('button', { name: 'Expand Behind it' }))
      expect(rowOf(blocker)).toBeUndefined()

      goFromBlocked()

      expect(rowOf(blocker)).toHaveAttribute('data-highlighted', 'on')
      expect(screen.getByRole('button', { name: 'Collapse Next in line' })).toBeInTheDocument()
      expect(getStoreInstance().getState()[spaceQueueViewSlice.name]).toMatchObject({ collapseAll: true })
      // The Next in line band, its three rows, then the blocker's
      expect(mockScrollToIndex).toHaveBeenCalledWith(3, expect.anything())
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

    const renderBlockedRow = (nextNonce: number, nextStatus?: QueueStatus) =>
      render(
        <DeleteTxDialogProvider>
          <Table>
            <TableBody>
              <SpaceQueueRow
                item={next}
                safeAddress={safeA}
                chainId={chainId}
                status="blocked"
                nextNonce={nextNonce}
                nextStatus={nextStatus}
              />
            </TableBody>
          </Table>
        </DeleteTxDialogProvider>,
      )

    const hoverBlockedBy = async (nonce: number) => {
      const button = screen.getByRole('button', { name: `Blocked by #${nonce}` })
      fireEvent.focus(button)
      fireEvent.pointerEnter(button)
      fireEvent.mouseEnter(button)
    }

    it('shows the status in the gauge, without a status chip, and "Blocked" only in the action', () => {
      renderBlockedRow(3)

      expect(screen.getByRole('button', { name: /^Blocked by #3\. \d+ of \d+ signatures?$/ })).toBeInTheDocument()
      const cells = screen.getByTestId('space-queue-row').querySelectorAll('td')
      expect([...cells].filter((cell) => cell.textContent?.includes('Blocked'))).toEqual([cells[cells.length - 1]])
      expect(screen.getByTestId('space-queue-row').querySelector('[data-slot="badge-dot"]')).toBeNull()
    })

    it('replaces the action of a blocked row with "Blocked by #n" and an arrow, a four-digit nonce included', () => {
      renderBlockedRow(1234)

      const button = screen.getByRole('button', { name: 'Blocked by #1234' })
      expect(button).toHaveTextContent(/^Blocked by #1234$/)
      expect(button.querySelector('svg.lucide-arrow-right')).toBeInTheDocument()
      expect(button).toHaveClass('whitespace-nowrap')
      expect(screen.queryByRole('button', { name: 'Execute' })).not.toBeInTheDocument()
    })

    it.each<[QueueStatus, string]>([
      ['sign', '#3 needs your signature first.'],
      ['execute', '#3 is fully signed. Execute it first.'],
    ])('says what the blocking transaction needs when it is to %s', async (nextStatus, hint) => {
      renderBlockedRow(3, nextStatus)

      await hoverBlockedBy(3)

      expect(await screen.findByText(hint)).toBeInTheDocument()
    })

    it('shows "Blocked by #n" on a row behind the next nonce that still needs signatures, but not the user\'s', () => {
      render(
        <DeleteTxDialogProvider>
          <Table>
            <TableBody>
              <SpaceQueueRow
                item={queued}
                safeAddress={safeA}
                chainId={chainId}
                status="waiting"
                nextNonce={3}
                nextStatus="waiting"
              />
            </TableBody>
          </Table>
        </DeleteTxDialogProvider>,
      )

      expect(screen.getByRole('button', { name: 'Blocked by #3' })).toBeInTheDocument()
    })

    it('keeps the action of a row behind the next nonce that the user can sign', () => {
      render(
        <DeleteTxDialogProvider>
          <Table>
            <TableBody>
              <SpaceQueueRow item={queued} safeAddress={safeA} chainId={chainId} status="sign" nextNonce={3} />
            </TableBody>
          </Table>
        </DeleteTxDialogProvider>,
      )

      expect(screen.queryByRole('button', { name: 'Blocked by #3' })).not.toBeInTheDocument()
    })

    it.each<QueueStatus>(['execute', 'sign', 'waiting'])('keeps the row action of a transaction to %s', (status) => {
      render(
        <DeleteTxDialogProvider>
          <Table>
            <TableBody>
              <SpaceQueueRow item={next} safeAddress={safeA} chainId={chainId} status={status} nextNonce={3} />
            </TableBody>
          </Table>
        </DeleteTxDialogProvider>,
      )

      expect(screen.queryByRole('button', { name: /^Blocked by #3$/ })).not.toBeInTheDocument()
    })

    it('asks the table to go to the blocking nonce of its own Safe and chain', () => {
      const goTo = jest.fn()
      render(
        <QueueNavigationContext.Provider value={{ goTo, highlights: createHighlightStore() }}>
          <DeleteTxDialogProvider>
            <Table>
              <TableBody>
                <SpaceQueueRow item={queued} safeAddress={safeA} chainId={chainId} status="blocked" nextNonce={3} />
              </TableBody>
            </Table>
          </DeleteTxDialogProvider>
        </QueueNavigationContext.Provider>,
      )

      fireEvent.click(screen.getByRole('button', { name: 'Blocked by #3' }))

      expect(goTo).toHaveBeenCalledWith({ safeAddress: safeA, chainId, nonce: 3 })
    })

    it('takes the focus and a highlight when the table goes to it', () => {
      const highlights = createHighlightStore()
      render(
        <QueueNavigationContext.Provider value={{ goTo: jest.fn(), highlights }}>
          <DeleteTxDialogProvider>
            <Table>
              <TableBody>
                <SpaceQueueRow item={next} safeAddress={safeA} chainId={chainId} status="execute" />
              </TableBody>
            </Table>
          </DeleteTxDialogProvider>
        </QueueNavigationContext.Provider>,
      )
      const row = screen.getByTestId('space-queue-row')
      expect(row).not.toHaveAttribute('data-highlighted')

      act(() => highlights.highlight(next.transaction.id))

      expect(row).toHaveAttribute('data-highlighted', 'on')
      expect(row).toHaveClass('[&>td]:bg-accent')
      expect(row).toHaveFocus()

      // A second go-to while it is still highlighted takes the focus back
      act(() => row.blur())
      expect(row).not.toHaveFocus()
      act(() => highlights.highlight(next.transaction.id))
      expect(row).toHaveFocus()
      highlights.dispose()
    })

    it('shows a focus ring for keyboard focus', () => {
      renderRow(next)

      // jsdom computes no Tailwind: outline-hidden and outline-2 share --tw-outline-style, so outline-solid must come along
      expect(screen.getByTestId('space-queue-row')).toHaveClass(
        'outline-hidden',
        'focus-visible:outline-solid',
        'focus-visible:outline-2',
        'focus-visible:outline-ring',
      )
      expect(screen.getByTestId('space-queue-row')).not.toHaveClass('outline-none')
    })

    const renderPendingRows = (pendingTxs: RootState['pendingTxs']) =>
      render(
        <DeleteTxDialogProvider>
          <Table>
            <TableBody>
              <SpaceQueueRow item={next} safeAddress={safeA} chainId={chainId} status="execute" />
              <SpaceQueueRow item={conflicting} safeAddress={safeA} chainId={chainId} status="execute" />
            </TableBody>
          </Table>
        </DeleteTxDialogProvider>,
        { initialReduxState: { pendingTxs } },
      )
    const conflicting = transactionItem('AWAITING_EXECUTION', 3)
    const cellsOf = (index: number) => screen.getAllByTestId('space-queue-row')[index].querySelectorAll('td')

    it('shows the executing state in the action column, not in Status, and disables the other option at its nonce', () => {
      jest.useFakeTimers({ now: 1_800_000_000_000 })
      renderPendingRows({
        [next.transaction.id]: {
          chainId,
          safeAddress: safeA,
          nonce: 3,
          status: PendingStatus.PROCESSING,
          txType: PendingTxType.SAFE_TX,
          txHash: '0x1',
          submittedAt: 1_800_000_000_000 - 82_000,
          signerNonce: 1,
          signerAddress: fakerChecksummedAddress(),
        },
      })

      const executing = cellsOf(0)
      expect(
        within(within(executing[5]).getByTestId('queue-row-pending-chip')).getByText('Processing 1:22'),
      ).toBeVisible()
      expect(executing[4]).not.toHaveTextContent(/Processing/)

      const other = cellsOf(1)
      expect(within(other[5]).getByRole('button', { name: 'Execute' })).toBeDisabled()
      expect(within(other[5]).getByTestId('queue-row-nonce-taken')).toBeInTheDocument()
      expect(screen.queryByText(/Locked/)).not.toBeInTheDocument()
      jest.useRealTimers()
    })

    it('shows a signature being saved in the action column and leaves the other option at its nonce alone', () => {
      renderPendingRows({
        [next.transaction.id]: {
          chainId,
          safeAddress: safeA,
          nonce: 3,
          status: PendingStatus.SIGNING,
          signerAddress: fakerChecksummedAddress(),
        },
      })

      expect(within(within(cellsOf(0)[5]).getByTestId('queue-row-pending-chip')).getByText('Signing')).toBeVisible()
      expect(cellsOf(0)[4]).not.toHaveTextContent(/Signing/)
      expect(screen.queryByTestId('queue-row-nonce-taken')).not.toBeInTheDocument()
    })

    it('keeps only the gauge in the 104px Status column', () => {
      expect(QUEUE_COLUMN_WIDTHS.Status).toBe(104)
    })

    it('fills one cell per column, with the Safe in its own column', () => {
      renderRow(next)

      const cells = screen.getByTestId('space-queue-row').querySelectorAll('td')
      expect(cells).toHaveLength(6)
      expect(cells[1]).toHaveTextContent(shortenAddress(safeA, 3))
    })
  })
})
