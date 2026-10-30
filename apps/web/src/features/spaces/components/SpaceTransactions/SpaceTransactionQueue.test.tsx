import { faker } from '@faker-js/faker'
import { fireEvent, render, screen } from '@/tests/test-utils'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import * as spaceQueueApi from '../../store/spaceQueueApi'
import type { SpaceQueue, SpaceQueueSection } from '../../store/spaceQueueApi'
import SpaceTransactionQueue from './SpaceTransactionQueue'

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
  ...overrides,
})

describe('SpaceTransactionQueue', () => {
  const spaceId = faker.string.uuid()
  const safeA = checksumAddress(faker.finance.ethereumAddress())
  const safeB = checksumAddress(faker.finance.ethereumAddress())
  let querySpy: jest.SpyInstance

  const refetch = jest.fn()

  const mockQueue = (state: { currentData?: SpaceQueue; isError?: boolean; isLoading?: boolean }) => {
    querySpy = jest.spyOn(spaceQueueApi, 'useGetSpaceQueueQuery').mockReturnValue({
      currentData: state.currentData,
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

    expect(querySpy).toHaveBeenCalledWith({ spaceId })
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

    expect(
      screen.getByText("2 Safe accounts couldn't be loaded, so their transactions aren't shown."),
    ).toBeInTheDocument()
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

    expect(screen.getByText('Error loading transactions')).toBeInTheDocument()
    expect(screen.queryByTestId('space-queue-safe')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(refetch).toHaveBeenCalled()
  })

  it('shows an error instead of the empty state when no Safe could be loaded', () => {
    mockQueue({ currentData: queue([], { unavailableSafes: [{ chainId: '1', safeAddress: safeA }] }) })

    render(<SpaceTransactionQueue spaceId={spaceId} />)

    expect(screen.getByText('Error loading transactions')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
    expect(screen.queryByText('Pending transactions of your Safe accounts will appear here')).not.toBeInTheDocument()
  })
})
