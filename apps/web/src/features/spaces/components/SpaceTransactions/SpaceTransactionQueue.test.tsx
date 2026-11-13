import { faker } from '@faker-js/faker'
import { fireEvent, render, screen } from '@/tests/test-utils'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import * as spaceQueueApi from '../../store/spaceQueueApi'
import type { SpaceQueue, SpaceQueueFilters, SpaceQueueSection } from '../../store/spaceQueueApi'
import { POLLING_INTERVAL } from '@/config/constants'
import SpaceTransactionQueue from './SpaceTransactionQueue'

const POLLING = { pollingInterval: POLLING_INTERVAL, skipPollingIfUnfocused: true }

const mockToolbarProps = jest.fn()
jest.mock('./TransactionsToolbar', () => ({
  __esModule: true,
  default: (props: {
    filters: SpaceQueueFilters
    onFiltersChange: (filters: SpaceQueueFilters) => void
    onSearchChange: (search: string) => void
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
      </>
    )
  },
}))

jest.mock('./SpaceQueueTable', () => ({
  __esModule: true,
  default: ({ sections }: { sections: SpaceQueueSection[] }) => (
    <>
      {sections.map((section) => (
        <div key={section.safeAddress} data-testid="space-queue-safe">
          {section.chains.length} chains of {section.safeAddress}
        </div>
      ))}
    </>
  ),
}))

const section = (safeAddress: string, chainIds: string[]): SpaceQueueSection => ({
  safeAddress,
  chains: chainIds.map((chainId) => ({ chainId, items: [] })),
})

const queue = (sections: SpaceQueueSection[], overrides: Partial<SpaceQueue> = {}): SpaceQueue => ({
  sections,
  unavailableSafes: [],
  shownCount: 0,
  totalCount: 0,
  isComplete: true,
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
  const safeA = checksumAddress(faker.finance.ethereumAddress())
  const safeB = checksumAddress(faker.finance.ethereumAddress())
  let querySpy: jest.SpyInstance

  const refetch = jest.fn()

  const mockQueue = (state: {
    currentData?: SpaceQueue
    data?: SpaceQueue
    isError?: boolean
    isLoading?: boolean
  }) => {
    querySpy = jest.spyOn(spaceQueueApi, 'useGetSpaceQueueQuery').mockReturnValue({
      currentData: state.currentData,
      data: state.data ?? state.currentData,
      isError: state.isError ?? false,
      isLoading: state.isLoading ?? false,
      refetch,
    } as unknown as ReturnType<typeof spaceQueueApi.useGetSpaceQueueQuery>)
  }

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('requests the queue of the Space and renders one section per Safe', () => {
    mockQueue({ currentData: queue([section(safeA, ['1', '10']), section(safeB, ['137'])]) })

    render(<SpaceTransactionQueue spaceId={spaceId} />)

    expect(querySpy).toHaveBeenCalledWith(
      { spaceId, filters: { statuses: [], safes: [], chainIds: [], signers: [] } },
      POLLING,
    )
    const sections = screen.getAllByTestId('space-queue-safe')
    expect(sections).toHaveLength(2)
    expect(sections[0]).toHaveTextContent(`2 chains of ${safeA}`)
    expect(sections[1]).toHaveTextContent(`1 chains of ${safeB}`)
  })

  it('tells how many of the queued transactions are shown when the gateway capped the queue', () => {
    mockQueue({
      currentData: queue([section(safeA, ['1'])], { shownCount: 500, totalCount: 742, isComplete: false }),
    })

    render(<SpaceTransactionQueue spaceId={spaceId} />)

    expect(screen.getByText('Showing 500 of 742 pending transactions.')).toBeInTheDocument()
  })

  it('does not mention a cap when the whole queue was returned', () => {
    mockQueue({ currentData: queue([section(safeA, ['1'])], { shownCount: 3, totalCount: 3 }) })

    render(<SpaceTransactionQueue spaceId={spaceId} />)

    expect(screen.queryByText(/^Showing/)).not.toBeInTheDocument()
  })

  it('shows the empty state when no Safe has pending transactions', () => {
    mockQueue({ currentData: queue([]) })

    render(<SpaceTransactionQueue spaceId={spaceId} />)

    expect(screen.getByText('Pending transactions of your Safe accounts will appear here')).toBeInTheDocument()
  })

  it('tells how many Safes could not be loaded next to the queue of the others', () => {
    mockQueue({
      currentData: queue([section(safeA, ['137'])], {
        unavailableSafes: [
          { chainId: '1', safeAddress: safeA },
          { chainId: '1', safeAddress: safeB },
        ],
      }),
    })

    render(<SpaceTransactionQueue spaceId={spaceId} />)

    expect(screen.getByText("2 Safe accounts couldn't be loaded")).toBeInTheDocument()
  })

  it('shows skeletons while the first queue loads', () => {
    mockQueue({ isLoading: true })

    render(<SpaceTransactionQueue spaceId={spaceId} />)

    expect(screen.queryByText('Pending transactions of your Safe accounts will appear here')).not.toBeInTheDocument()
    expect(screen.queryByTestId('space-queue-safe')).not.toBeInTheDocument()
  })

  it('shows an error with a retry when the queue fails to load', () => {
    mockQueue({ isError: true })

    render(<SpaceTransactionQueue spaceId={spaceId} />)

    expect(screen.getByText("Couldn't load the queue")).toBeInTheDocument()
    expect(screen.queryByTestId('space-queue-safe')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(refetch).toHaveBeenCalled()
  })

  it('shows the empty state with the unavailable Safes when none of them could be loaded', () => {
    mockQueue({ currentData: queue([], { unavailableSafes: [{ chainId: '1', safeAddress: safeA }] }) })

    render(<SpaceTransactionQueue spaceId={spaceId} />)

    expect(screen.queryByText("Couldn't load the queue")).not.toBeInTheDocument()
    expect(screen.getByText('Pending transactions of your Safe accounts will appear here')).toBeInTheDocument()
    expect(screen.getByText("1 Safe account couldn't be loaded")).toBeInTheDocument()
  })

  it('requests the queue again with the filters chosen in the toolbar', () => {
    mockQueue({ currentData: queue([section(safeA, ['1'])]) })

    render(<SpaceTransactionQueue spaceId={spaceId} />)
    fireEvent.click(screen.getByRole('button', { name: 'Filter by sign' }))

    expect(querySpy).toHaveBeenLastCalledWith(
      {
        spaceId,
        filters: { statuses: ['sign'], safes: [], chainIds: [], signers: [] },
      },
      POLLING,
    )
    expect(mockToolbarProps).toHaveBeenLastCalledWith(
      expect.objectContaining({ filters: { statuses: ['sign'], safes: [], chainIds: [], signers: [] } }),
    )
  })

  it('tells that nothing matches the filters instead of the empty queue state', () => {
    mockQueue({ currentData: queue([]) })

    render(<SpaceTransactionQueue spaceId={spaceId} />)
    fireEvent.click(screen.getByRole('button', { name: 'Filter by sign' }))

    expect(screen.getByText('No proposals match these filters')).toBeInTheDocument()
    expect(screen.queryByText('Pending transactions of your Safe accounts will appear here')).not.toBeInTheDocument()
  })

  it('clears the filters and the search from the no-match state', () => {
    mockQueue({ currentData: queue([]) })

    render(<SpaceTransactionQueue spaceId={spaceId} />)
    fireEvent.click(screen.getByRole('button', { name: 'Filter by sign' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Search' }), { target: { value: 'treasury' } })
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))

    expect(querySpy.mock.lastCall?.[0]).toEqual({
      spaceId,
      filters: { statuses: [], safes: [], chainIds: [], signers: [] },
    })
    expect(screen.getByRole('textbox', { name: 'Search' })).toHaveValue('')
  })

  describe('search', () => {
    const typeSearch = (value: string) =>
      fireEvent.change(screen.getByRole('textbox', { name: 'Search' }), { target: { value } })

    it('requests the queue with the search from the toolbar', () => {
      mockQueue({ currentData: queue([section(safeA, ['1'])]) })

      render(<SpaceTransactionQueue spaceId={spaceId} />)

      expect(querySpy).toHaveBeenLastCalledWith(
        {
          spaceId,
          filters: { statuses: [], safes: [], chainIds: [], signers: [] },
        },
        POLLING,
      )

      typeSearch('treasury')

      expect(querySpy).toHaveBeenLastCalledWith(
        {
          spaceId,
          filters: { statuses: [], safes: [], chainIds: [], signers: [] },
          search: 'treasury',
        },
        POLLING,
      )
    })

    it('requests the queue without a search once it is cleared', () => {
      mockQueue({ currentData: queue([section(safeA, ['1'])]) })

      render(<SpaceTransactionQueue spaceId={spaceId} />)
      typeSearch('treasury')
      typeSearch('')

      expect(querySpy.mock.lastCall?.[0]).toEqual({
        spaceId,
        filters: { statuses: [], safes: [], chainIds: [], signers: [] },
      })
    })

    it('tells that nothing matches the search instead of the empty queue state', () => {
      mockQueue({ currentData: queue([]) })

      render(<SpaceTransactionQueue spaceId={spaceId} />)
      typeSearch('no such safe')

      expect(screen.getByText('No proposals match these filters')).toBeInTheDocument()
      expect(screen.queryByText('Pending transactions of your Safe accounts will appear here')).not.toBeInTheDocument()
    })

    it('tells that nothing matches the search, not a load error, when some Safes are unavailable', () => {
      mockQueue({ currentData: queue([], { unavailableSafes: [{ chainId: '1', safeAddress: safeA }] }) })

      render(<SpaceTransactionQueue spaceId={spaceId} />)
      typeSearch('no such safe')

      expect(screen.getByText('No proposals match these filters')).toBeInTheDocument()
      expect(screen.queryByText("Couldn't load the queue")).not.toBeInTheDocument()
    })
  })

  it('keeps the last counts in the toolbar while a filtered queue loads', () => {
    const previous = queue([section(safeA, ['1'])], {
      counts: {
        total: 3,
        execute: 1,
        sign: 2,
        blocked: 0,
        waiting: 0,
        conflicting: 0,
        stale: 0,
        safes: [],
        chains: [],
        signers: [],
      },
    })
    mockQueue({ currentData: undefined, data: previous })

    render(<SpaceTransactionQueue spaceId={spaceId} />)

    expect(mockToolbarProps).toHaveBeenLastCalledWith(expect.objectContaining({ counts: previous.counts }))
    expect(screen.queryByTestId('space-queue-safe')).not.toBeInTheDocument()
  })
})
