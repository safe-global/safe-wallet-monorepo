import { faker } from '@faker-js/faker'
import { delay, http, HttpResponse } from 'msw'
import { POLLING_INTERVAL } from '@/config/constants'
import { GATEWAY_URL } from '@/config/gateway'
import { server } from '@/tests/server'
import { act, fireEvent, render, screen, waitFor } from '@/tests/test-utils'
import { setBaseUrl } from '@safe-global/store/gateway/cgwClient'
import type { SpaceQueuedItemPage, TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { TransactionListItemType } from '@safe-global/store/gateway/types'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { safeTxSummaryBuilder } from '@/tests/builders/safeTx'
import { TxEvent, txDispatch } from '@/services/tx/txEvents'
import { NO_SPACE_QUEUE_FILTERS, type SpaceQueueFilters, type SpaceQueueSection } from '../../hooks/useSpaceQueue'
import SpaceTransactionQueue from './SpaceTransactionQueue'

const mockToolbarProps = jest.fn()
jest.mock('./TransactionsToolbar', () => ({
  __esModule: true,
  default: (props: {
    filters: SpaceQueueFilters
    onFiltersChange: (filters: SpaceQueueFilters) => void
    onSearchChange: (search: string) => void
    onGroupByChange: (groupBy: string) => void
  }) => {
    mockToolbarProps(props)
    return (
      <>
        <button
          type="button"
          onClick={() => props.onFiltersChange({ statuses: ['sign'], safes: [], chainIds: [], signers: [] })}
        >
          Filter by sign
        </button>
        <input aria-label="Search" onChange={(event) => props.onSearchChange(event.target.value)} />
        <button type="button" onClick={() => props.onGroupByChange('network')}>
          Group by network
        </button>
      </>
    )
  },
}))

jest.mock('./SpaceQueueTable', () => ({
  __esModule: true,
  default: ({ sections, groupBy }: { sections: SpaceQueueSection[]; groupBy: string }) => (
    <div data-testid="space-queue-table" data-group-by={groupBy}>
      {sections.map((section) => (
        <div key={section.safeAddress} data-testid="space-queue-safe">
          {section.chains.length} chains of {section.safeAddress}
        </div>
      ))}
    </div>
  ),
}))

const transactions = (count: number): TransactionQueuedItem[] =>
  Array.from({ length: count }, () => ({
    type: TransactionListItemType.TRANSACTION,
    conflictType: 'None',
    transaction: safeTxSummaryBuilder().build(),
  }))

const page = (
  results: SpaceQueuedItemPage['results'],
  overrides: Partial<SpaceQueuedItemPage> = {},
): SpaceQueuedItemPage => ({
  count: null,
  next: null,
  previous: null,
  results,
  unavailableSafes: [],
  counts: {
    total: 0,
    execute: 0,
    sign: 0,
    blocked: 0,
    waiting: 0,
    conflicting: 0,
    stale: 0,
    safes: [],
    chains: [],
    signers: [],
  },
  ...overrides,
})

describe('SpaceTransactionQueue', () => {
  const spaceId = faker.string.uuid()
  const queueUrl = `${GATEWAY_URL}/v1/spaces/${spaceId}/transactions/queued`
  const safeA = checksumAddress(faker.finance.ethereumAddress())
  const safeB = checksumAddress(faker.finance.ethereumAddress())

  const respondWith = (body: SpaceQueuedItemPage | null, status = 200) => {
    const requests: Request[] = []
    server.use(
      http.get(queueUrl, ({ request }) => {
        requests.push(request)
        return body ? HttpResponse.json(body) : new HttpResponse(null, { status })
      }),
    )
    return requests
  }

  beforeEach(() => {
    setBaseUrl(GATEWAY_URL)
    server.use(http.get(`${GATEWAY_URL}/v1/spaces/${spaceId}/safes`, () => HttpResponse.json({ safes: {} })))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('requests the queue of the Space and renders one section per Safe', async () => {
    respondWith(page({ [safeA]: { '1': transactions(1), '10': transactions(1) }, [safeB]: { '137': transactions(1) } }))

    render(<SpaceTransactionQueue spaceId={spaceId} />)

    const sections = await screen.findAllByTestId('space-queue-safe')
    expect(sections).toHaveLength(2)
    expect(sections[0]).toHaveTextContent(`2 chains of ${safeA}`)
    expect(sections[1]).toHaveTextContent(`1 chains of ${safeB}`)
  })

  it('tells how many of the queued transactions are shown when the gateway capped the queue', async () => {
    respondWith(page({ [safeA]: { '1': transactions(3) } }, { count: 742 }))

    render(<SpaceTransactionQueue spaceId={spaceId} />)

    expect(await screen.findByText('Showing 3 of 742 pending transactions.')).toBeInTheDocument()
  })

  it('does not mention a cap when the whole queue was returned', async () => {
    respondWith(page({ [safeA]: { '1': transactions(3) } }, { count: 3 }))

    render(<SpaceTransactionQueue spaceId={spaceId} />)

    await screen.findByTestId('space-queue-safe')
    expect(screen.queryByText(/^Showing/)).not.toBeInTheDocument()
  })

  it('shows the empty state when no Safe has pending transactions', async () => {
    respondWith(page({}, { count: 0 }))

    render(<SpaceTransactionQueue spaceId={spaceId} />)

    expect(await screen.findByText('Pending transactions of your Safe accounts will appear here')).toBeInTheDocument()
  })

  it('tells how many Safes could not be loaded next to the queue of the others', async () => {
    respondWith(
      page(
        { [safeA]: { '137': transactions(1) } },
        {
          unavailableSafes: [
            { chainId: '1', safeAddress: safeA },
            { chainId: '1', safeAddress: safeB },
          ],
        },
      ),
    )

    render(<SpaceTransactionQueue spaceId={spaceId} />)

    expect(await screen.findByText("2 Safe accounts couldn't be loaded")).toBeInTheDocument()
    expect(screen.getByTestId('space-queue-safe')).toBeInTheDocument()
  })

  it('shows skeletons while the first queue loads', () => {
    respondWith(page({ [safeA]: { '1': transactions(1) } }))

    render(<SpaceTransactionQueue spaceId={spaceId} />)

    expect(screen.queryByText('Pending transactions of your Safe accounts will appear here')).not.toBeInTheDocument()
    expect(screen.queryByTestId('space-queue-safe')).not.toBeInTheDocument()
  })

  it('shows an error when the queue fails to load', async () => {
    respondWith(null, 500)

    render(<SpaceTransactionQueue spaceId={spaceId} />)

    expect(await screen.findByText("Couldn't load the queue")).toBeInTheDocument()
    expect(screen.queryByTestId('space-queue-safe')).not.toBeInTheDocument()
  })

  it('shows the empty state with the unavailable Safes when none of them could be loaded', async () => {
    respondWith(page({}, { unavailableSafes: [{ chainId: '1', safeAddress: safeA }] }))

    render(<SpaceTransactionQueue spaceId={spaceId} />)

    expect(await screen.findByText("1 Safe account couldn't be loaded")).toBeInTheDocument()
    expect(screen.getByText('Pending transactions of your Safe accounts will appear here')).toBeInTheDocument()
    expect(screen.queryByText("Couldn't load the queue")).not.toBeInTheDocument()
  })

  it('requests the queue again on retry', async () => {
    const requests = respondWith(null, 500)
    render(<SpaceTransactionQueue spaceId={spaceId} />)
    await screen.findByText("Couldn't load the queue")

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))

    await waitFor(() => expect(requests).toHaveLength(2))
  })

  it('shows the queue returned after a transaction event', async () => {
    respondWith(page({ [safeA]: { '1': transactions(1) } }))
    render(<SpaceTransactionQueue spaceId={spaceId} />)
    await screen.findByTestId('space-queue-safe')
    respondWith(page({ [safeA]: { '1': transactions(1) }, [safeB]: { '137': transactions(1) } }))

    txDispatch(TxEvent.DELETED, { safeTxHash: faker.string.hexadecimal({ length: 64 }) })

    await waitFor(() => expect(screen.getAllByTestId('space-queue-safe')).toHaveLength(2))
  })

  it('requests the queue again with the filters chosen in the toolbar', async () => {
    const requests = respondWith(page({ [safeA]: { '1': transactions(1) } }))
    render(<SpaceTransactionQueue spaceId={spaceId} />)
    await screen.findByTestId('space-queue-safe')

    fireEvent.click(screen.getByRole('button', { name: 'Filter by sign' }))

    await waitFor(() => expect(requests).toHaveLength(2))
    expect(new URL(requests[1].url).searchParams.get('status')).toBe('sign')
  })

  it('requests the filtered queue again after a transaction event', async () => {
    const requests = respondWith(page({ [safeA]: { '1': transactions(1) } }))
    render(<SpaceTransactionQueue spaceId={spaceId} />)
    await screen.findByTestId('space-queue-safe')
    fireEvent.click(screen.getByRole('button', { name: 'Filter by sign' }))
    await waitFor(() => expect(requests).toHaveLength(2))

    txDispatch(TxEvent.DELETED, { safeTxHash: faker.string.hexadecimal({ length: 64 }) })

    await waitFor(() => expect(requests).toHaveLength(3))
    expect(new URL(requests[2].url).searchParams.get('status')).toBe('sign')
  })

  it('polls the filtered queue it shows', async () => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] })
    const requests = respondWith(page({ [safeA]: { '1': transactions(1) } }))
    render(<SpaceTransactionQueue spaceId={spaceId} />)
    await screen.findByTestId('space-queue-safe')
    fireEvent.click(screen.getByRole('button', { name: 'Filter by sign' }))
    await waitFor(() => expect(requests).toHaveLength(2))

    await act(() => jest.advanceTimersByTimeAsync(POLLING_INTERVAL))

    await waitFor(() => expect(requests).toHaveLength(3))
    expect(new URL(requests[2].url).searchParams.get('status')).toBe('sign')
  })

  it('passes the filters chosen in the toolbar back to the toolbar', async () => {
    respondWith(page({ [safeA]: { '1': transactions(1) } }))
    render(<SpaceTransactionQueue spaceId={spaceId} />)
    await screen.findByTestId('space-queue-safe')

    fireEvent.click(screen.getByRole('button', { name: 'Filter by sign' }))

    expect(mockToolbarProps).toHaveBeenLastCalledWith(
      expect.objectContaining({ filters: { statuses: ['sign'], safes: [], chainIds: [], signers: [] } }),
    )
  })

  it('tells that nothing matches the filters instead of the empty queue state', async () => {
    respondWith(page({}, { count: 0 }))
    render(<SpaceTransactionQueue spaceId={spaceId} />)
    await screen.findByText('Pending transactions of your Safe accounts will appear here')

    fireEvent.click(screen.getByRole('button', { name: 'Filter by sign' }))

    expect(await screen.findByText('No proposals match these filters')).toBeInTheDocument()
    expect(screen.queryByText('Pending transactions of your Safe accounts will appear here')).not.toBeInTheDocument()
  })

  it('clears the filters and the search from the no-match state', async () => {
    respondWith(page({}, { count: 0 }))
    render(<SpaceTransactionQueue spaceId={spaceId} />)
    fireEvent.click(screen.getByRole('button', { name: 'Filter by sign' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Search' }), { target: { value: 'treasury' } })
    fireEvent.click(await screen.findByRole('button', { name: 'Clear filters' }))

    expect(await screen.findByText('Pending transactions of your Safe accounts will appear here')).toBeInTheDocument()
    expect(mockToolbarProps).toHaveBeenLastCalledWith(expect.objectContaining({ filters: NO_SPACE_QUEUE_FILTERS }))
    expect(screen.getByRole('textbox', { name: 'Search' })).toHaveValue('')
  })

  describe('search', () => {
    const typeSearch = (value: string) =>
      fireEvent.change(screen.getByRole('textbox', { name: 'Search' }), { target: { value } })

    const respondBySearch = () => {
      const requests: Request[] = []
      server.use(
        http.get(queueUrl, ({ request }) => {
          requests.push(request)
          const isSearched = new URL(request.url).searchParams.has('search')
          return HttpResponse.json(isSearched ? page({}, { count: 0 }) : page({ [safeA]: { '1': transactions(1) } }))
        }),
      )
      return requests
    }

    it('requests the queue with the search from the toolbar', async () => {
      const requests = respondBySearch()
      render(<SpaceTransactionQueue spaceId={spaceId} />)
      await screen.findByTestId('space-queue-safe')

      typeSearch('treasury')

      await waitFor(() => expect(requests).toHaveLength(2))
      expect(new URL(requests[1].url).searchParams.get('search')).toBe('treasury')
    })

    it('shows the whole queue again once the search is cleared', async () => {
      respondBySearch()
      render(<SpaceTransactionQueue spaceId={spaceId} />)
      await screen.findByTestId('space-queue-safe')
      typeSearch('treasury')
      await waitFor(() => expect(screen.queryByTestId('space-queue-safe')).not.toBeInTheDocument())

      typeSearch('')

      expect(await screen.findByTestId('space-queue-safe')).toBeInTheDocument()
    })

    it('tells that nothing matches the search instead of the empty queue state', async () => {
      respondBySearch()
      render(<SpaceTransactionQueue spaceId={spaceId} />)
      await screen.findByTestId('space-queue-safe')

      typeSearch('no such safe')

      expect(await screen.findByText('No proposals match your search')).toBeInTheDocument()
      expect(screen.queryByText('Pending transactions of your Safe accounts will appear here')).not.toBeInTheDocument()
    })

    it('tells that nothing matches the filters when a search narrows them too', async () => {
      respondBySearch()
      render(<SpaceTransactionQueue spaceId={spaceId} />)
      await screen.findByTestId('space-queue-safe')

      fireEvent.click(screen.getByRole('button', { name: 'Filter by sign' }))
      typeSearch('no such safe')

      expect(await screen.findByText('No proposals match these filters')).toBeInTheDocument()
    })

    it('clears the search from the no-match state', async () => {
      respondBySearch()
      render(<SpaceTransactionQueue spaceId={spaceId} />)
      await screen.findByTestId('space-queue-safe')
      typeSearch('no such safe')

      fireEvent.click(await screen.findByRole('button', { name: 'Clear search' }))

      expect(await screen.findByTestId('space-queue-safe')).toBeInTheDocument()
      expect(screen.getByRole('textbox', { name: 'Search' })).toHaveValue('')
    })

    it('tells that nothing matches the search, not a load error, when some Safes are unavailable', async () => {
      server.use(
        http.get(queueUrl, ({ request }) =>
          HttpResponse.json(
            new URL(request.url).searchParams.has('search')
              ? page({}, { count: 0, unavailableSafes: [{ chainId: '1', safeAddress: safeA }] })
              : page({ [safeA]: { '1': transactions(1) } }),
          ),
        ),
      )
      render(<SpaceTransactionQueue spaceId={spaceId} />)
      await screen.findByTestId('space-queue-safe')

      typeSearch('no such safe')

      expect(await screen.findByText('No proposals match your search')).toBeInTheDocument()
      expect(screen.queryByText("Couldn't load the queue")).not.toBeInTheDocument()
    })
  })

  describe('group by', () => {
    it('lists the queue by status when no grouping was picked', async () => {
      respondWith(page({ [safeA]: { '1': transactions(1) } }))

      render(<SpaceTransactionQueue spaceId={spaceId} />)

      expect(await screen.findByTestId('space-queue-table')).toHaveAttribute('data-group-by', 'status')
    })

    it('regroups the queue with the grouping picked in the toolbar', async () => {
      respondWith(page({ [safeA]: { '1': transactions(1) } }))
      render(<SpaceTransactionQueue spaceId={spaceId} />)
      await screen.findByTestId('space-queue-table')

      fireEvent.click(screen.getByRole('button', { name: 'Group by network' }))

      await waitFor(() => expect(screen.getByTestId('space-queue-table')).toHaveAttribute('data-group-by', 'network'))
    })

    it('regroups the queue without requesting it again', async () => {
      const requests = respondWith(page({ [safeA]: { '1': transactions(1) } }))
      render(<SpaceTransactionQueue spaceId={spaceId} />)
      await screen.findByTestId('space-queue-table')
      const requestCount = requests.length

      fireEvent.click(screen.getByRole('button', { name: 'Group by network' }))
      await waitFor(() => expect(screen.getByTestId('space-queue-table')).toHaveAttribute('data-group-by', 'network'))

      expect(requests).toHaveLength(requestCount)
    })

    it('opens the queue with the grouping picked earlier in the session', async () => {
      respondWith(page({ [safeA]: { '1': transactions(1) } }))

      render(<SpaceTransactionQueue spaceId={spaceId} />, {
        initialReduxState: { spaceQueueView: { groupBy: 'next' } },
      })

      expect(await screen.findByTestId('space-queue-table')).toHaveAttribute('data-group-by', 'next')
    })
  })

  it('keeps the last counts in the toolbar while a filtered queue loads', async () => {
    const counts = { ...page({}).counts, total: 3, execute: 1, sign: 2 }
    server.use(
      http.get(queueUrl, async ({ request }) => {
        if (new URL(request.url).searchParams.has('status')) await delay('infinite')
        return HttpResponse.json(page({ [safeA]: { '1': transactions(3) } }, { count: 3, counts }))
      }),
    )
    render(<SpaceTransactionQueue spaceId={spaceId} />)
    await screen.findByTestId('space-queue-safe')

    fireEvent.click(screen.getByRole('button', { name: 'Filter by sign' }))

    await waitFor(() => expect(screen.queryByTestId('space-queue-safe')).not.toBeInTheDocument())
    expect(mockToolbarProps).toHaveBeenLastCalledWith(expect.objectContaining({ counts }))
  })
})
