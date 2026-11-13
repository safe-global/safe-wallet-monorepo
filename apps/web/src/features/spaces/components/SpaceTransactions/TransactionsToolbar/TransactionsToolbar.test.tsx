import { faker } from '@faker-js/faker'
import type { SpaceQueueCounts } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { fireEvent, render, screen, within } from '@/tests/test-utils'
import { NO_SPACE_QUEUE_FILTERS, type SpaceQueueFilters } from '../../../store/spaceQueueApi'
import TransactionsToolbar from '.'

jest.mock('../NewTransactionButton', () => ({ __esModule: true, default: () => null }))

const safeA = checksumAddress(faker.finance.ethereumAddress())
const safeB = checksumAddress(faker.finance.ethereumAddress())
const signerA = checksumAddress(faker.finance.ethereumAddress())
const signerB = checksumAddress(faker.finance.ethereumAddress())

const counts: SpaceQueueCounts = {
  total: 19,
  execute: 1,
  sign: 10,
  blocked: 7,
  waiting: 1,
  conflicting: 2,
  stale: 0,
  safes: [
    { chainId: '1', safeAddress: safeA, count: 4 },
    { chainId: '1', safeAddress: safeB, count: 8 },
  ],
  chains: [
    { chainId: '1', count: 12 },
    { chainId: '137', count: 3 },
  ],
  signers: [
    { address: signerA, count: 2 },
    { address: signerB, count: 9 },
  ],
}

const renderToolbar = (filters: SpaceQueueFilters = NO_SPACE_QUEUE_FILTERS) => {
  const onFiltersChange = jest.fn()
  render(
    <TransactionsToolbar
      spaceId={faker.string.uuid()}
      counts={counts}
      filters={filters}
      onFiltersChange={onFiltersChange}
      onSearchChange={jest.fn()}
      groupBy="status"
      onGroupByChange={jest.fn()}
    />,
  )
  return onFiltersChange
}

describe('TransactionsToolbar', () => {
  it('lists every status with its count and adds the one picked to the filters', () => {
    const onFiltersChange = renderToolbar({ statuses: ['execute'], safes: [], chainIds: [], signers: [] })

    fireEvent.click(screen.getByRole('button', { name: 'Status' }))
    const options = screen.getAllByRole('menuitemcheckbox')

    expect(options.map((option) => option.textContent)).toEqual([
      'Execute1',
      'Sign10',
      'Blocked7',
      'Waiting1',
      'Conflicting2',
      'Stale 7 days0',
    ])
    expect(options[0]).toHaveAttribute('aria-checked', 'true')

    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: /Sign/ }))

    expect(onFiltersChange).toHaveBeenCalledWith({
      statuses: ['execute', 'sign'],
      safes: [],
      chainIds: [],
      signers: [],
    })
  })

  it('shows each status with its icon, statuses on a tinted tile and flags muted', () => {
    renderToolbar()

    fireEvent.click(screen.getByRole('button', { name: 'Status' }))
    const icons = screen.getAllByRole('menuitemcheckbox').map((option) => option.querySelector('svg.lucide'))

    expect(
      icons.map((icon) =>
        icon
          ?.getAttribute('class')
          ?.match(/lucide-[a-z0-9-]+/g)
          ?.at(-1),
      ),
    ).toEqual([
      'lucide-circle-check',
      'lucide-pen-line',
      'lucide-clock-3',
      'lucide-users',
      'lucide-split',
      'lucide-calendar-clock',
    ])
    expect(icons[0]?.parentElement).toHaveClass('bg-success-subtle', 'text-success-strong')
    expect(icons[1]?.parentElement).toHaveClass('bg-success-subtle', 'text-success-strong')
    expect(icons[2]?.parentElement).toHaveClass('bg-warning-subtle', 'text-warning-strong')
    expect(icons[3]?.parentElement).toHaveClass('bg-warning-subtle', 'text-warning-strong')
    expect(icons[4]).toHaveClass('text-muted-foreground')
    expect(icons[5]).toHaveClass('text-muted-foreground')
  })

  it('removes a status that is picked again', () => {
    const onFiltersChange = renderToolbar({ statuses: ['execute', 'sign'], safes: [], chainIds: [], signers: [] })

    fireEvent.click(screen.getByRole('button', { name: 'Status' }))
    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: /Execute/ }))

    expect(onFiltersChange).toHaveBeenCalledWith({ statuses: ['sign'], safes: [], chainIds: [], signers: [] })
  })

  it('lists the Safes by count and selects every chain of the one picked', () => {
    const onFiltersChange = renderToolbar()

    fireEvent.click(screen.getByRole('button', { name: 'Safe' }))
    const options = screen.getAllByRole('menuitemcheckbox')

    expect(options).toHaveLength(2)
    expect(options[0]).toHaveTextContent('8')
    expect(options[1]).toHaveTextContent('4')

    fireEvent.click(options[1])

    expect(onFiltersChange).toHaveBeenCalledWith({
      statuses: [],
      safes: [{ chainId: '1', safeAddress: safeA }],
      chainIds: [],
      signers: [],
    })
  })

  it('lists the networks by count in the Filter menu and adds the one picked', () => {
    const onFiltersChange = renderToolbar()

    fireEvent.click(screen.getByRole('button', { name: 'Filter' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Network' }))
    const options = screen.getAllByRole('menuitemcheckbox')

    expect(options.map((option) => option.textContent)).toEqual([
      expect.stringMatching(/12$/),
      expect.stringMatching(/3$/),
    ])

    fireEvent.click(options[1])

    expect(onFiltersChange).toHaveBeenCalledWith({ ...NO_SPACE_QUEUE_FILTERS, chainIds: ['137'] })
  })

  it('lists the signers by count in the Filter menu and removes one picked again, in any address case', () => {
    const onFiltersChange = renderToolbar({ ...NO_SPACE_QUEUE_FILTERS, signers: [signerB.toLowerCase()] })

    fireEvent.click(screen.getByRole('button', { name: 'Filter' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Signer' }))
    const options = screen.getAllByRole('menuitemcheckbox')

    expect(options).toHaveLength(2)
    expect(options[0]).toHaveTextContent('9')
    expect(options[0]).toHaveAttribute('aria-checked', 'true')
    expect(options[1]).toHaveTextContent('2')

    fireEvent.click(options[0])

    expect(onFiltersChange).toHaveBeenCalledWith(NO_SPACE_QUEUE_FILTERS)
  })

  it('shows a chip for the networks and one for the signers, each removing its own filter', () => {
    const filters = { ...NO_SPACE_QUEUE_FILTERS, chainIds: ['1'], signers: [signerA] }
    const onFiltersChange = renderToolbar(filters)

    const signerChip = screen.getByText('Signer:').parentElement as HTMLElement
    expect(screen.getByText('Network:')).toBeInTheDocument()

    fireEvent.click(within(signerChip).getByRole('button', { name: 'Remove' }))

    expect(onFiltersChange).toHaveBeenLastCalledWith({ ...filters, signers: [] })
  })

  it('shows no chips without filters', () => {
    renderToolbar()

    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument()
  })

  it('shows one chip per filter, naming up to two values', () => {
    renderToolbar({ statuses: ['sign', 'execute', 'blocked', 'conflicting'], safes: [], chainIds: [], signers: [] })

    expect(screen.getByText('Status:').parentElement).toHaveTextContent('Status:Ready to sign, Ready to execute +2')
  })

  it('removes one filter from its chip and every filter with Clear', () => {
    const onFiltersChange = renderToolbar({
      statuses: ['sign'],
      safes: [{ chainId: '1', safeAddress: safeA }],
      chainIds: [],
      signers: [],
    })

    const statusChip = screen.getByText('Status:').parentElement as HTMLElement
    fireEvent.click(within(statusChip).getByRole('button', { name: 'Remove' }))
    expect(onFiltersChange).toHaveBeenLastCalledWith({
      statuses: [],
      safes: [{ chainId: '1', safeAddress: safeA }],
      chainIds: [],
      signers: [],
    })

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(onFiltersChange).toHaveBeenLastCalledWith(NO_SPACE_QUEUE_FILTERS)
  })

  it('passes the grouping picked in Group by on to the queue', () => {
    const onGroupByChange = jest.fn()
    render(
      <TransactionsToolbar
        spaceId={faker.string.uuid()}
        counts={counts}
        filters={NO_SPACE_QUEUE_FILTERS}
        onFiltersChange={jest.fn()}
        onSearchChange={jest.fn()}
        groupBy="status"
        onGroupByChange={onGroupByChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Group by Status' }))
    fireEvent.click(screen.getByRole('menuitemradio', { name: /Up next/ }))

    expect(onGroupByChange).toHaveBeenCalledWith('next')
  })

  it('passes the search on to the queue', () => {
    const onSearchChange = jest.fn()
    render(
      <TransactionsToolbar
        spaceId={faker.string.uuid()}
        counts={counts}
        filters={NO_SPACE_QUEUE_FILTERS}
        onFiltersChange={jest.fn()}
        onSearchChange={onSearchChange}
        groupBy="status"
        onGroupByChange={jest.fn()}
      />,
    )
    const searchbox = screen.getByRole('searchbox', { name: 'Search transactions' })

    expect(searchbox).toBeEnabled()
    fireEvent.change(searchbox, { target: { value: 'polygon' } })
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(onSearchChange).toHaveBeenLastCalledWith('')
  })
})
