import { faker } from '@faker-js/faker'
import type { SpaceQueueCounts } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { act, fireEvent, render, screen, within } from '@/tests/test-utils'
import { NO_SPACE_QUEUE_FILTERS, type SpaceQueueFilters } from '../../../hooks/useSpaceQueue'
import TransactionsToolbar from './TransactionsToolbar'

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

const openFilterSection = (section: string) => {
  fireEvent.click(screen.getByRole('button', { name: 'Filter' }))
  fireEvent.click(screen.getByRole('menuitem', { name: section }))
}

describe('TransactionsToolbar', () => {
  it('has no Urgency or Safe button beside the Filter menu', () => {
    renderToolbar()

    expect(screen.queryByRole('button', { name: 'Urgency' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Safe' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Filter' })).toBeInTheDocument()
  })

  it('lists every status and flag with its count', () => {
    renderToolbar()

    openFilterSection('Urgency')

    expect(screen.getAllByRole('menuitemcheckbox').map((option) => option.textContent)).toEqual([
      'Execute1',
      'Sign10',
      'Blocked7',
      'Waiting1',
      'Conflicting2',
      'Stale 7 days0',
    ])
  })

  it('checks the selected statuses', () => {
    renderToolbar({ ...NO_SPACE_QUEUE_FILTERS, statuses: ['execute'] })

    openFilterSection('Urgency')

    expect(screen.getByRole('menuitemcheckbox', { name: /Execute/ })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('menuitemcheckbox', { name: /Sign/ })).toHaveAttribute('aria-checked', 'false')
  })

  it('adds a status that is picked to the filters', () => {
    const onFiltersChange = renderToolbar({ ...NO_SPACE_QUEUE_FILTERS, statuses: ['execute'] })

    openFilterSection('Urgency')
    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: /Sign/ }))

    expect(onFiltersChange).toHaveBeenCalledWith({ ...NO_SPACE_QUEUE_FILTERS, statuses: ['execute', 'sign'] })
  })

  it('hides the flag counts in the Urgency menu while a status is selected', () => {
    renderToolbar({ ...NO_SPACE_QUEUE_FILTERS, statuses: ['sign'] })

    openFilterSection('Urgency')

    expect(screen.getAllByRole('menuitemcheckbox').map((option) => option.textContent)).toEqual([
      'Execute1',
      'Sign10',
      'Blocked7',
      'Waiting1',
      'Conflicting',
      'Stale 7 days',
    ])
  })

  it('hides the status counts in the Urgency menu while a flag is selected', () => {
    renderToolbar({ ...NO_SPACE_QUEUE_FILTERS, statuses: ['conflicting'] })

    openFilterSection('Urgency')

    expect(screen.getAllByRole('menuitemcheckbox').map((option) => option.textContent)).toEqual([
      'Execute',
      'Sign',
      'Blocked',
      'Waiting',
      'Conflicting2',
      'Stale 7 days0',
    ])
  })

  it('removes a status that is picked again', () => {
    const onFiltersChange = renderToolbar({ statuses: ['execute', 'sign'], safes: [], chainIds: [], signers: [] })

    openFilterSection('Urgency')
    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: /Execute/ }))

    expect(onFiltersChange).toHaveBeenCalledWith({ statuses: ['sign'], safes: [], chainIds: [], signers: [] })
  })

  it('lists the Safes by count in the Filter menu and selects every chain of the one picked', () => {
    const onFiltersChange = renderToolbar()

    openFilterSection('Safe account')
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

    openFilterSection('Network')
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

    openFilterSection('Signer')
    const options = screen.getAllByRole('menuitemcheckbox')

    expect(options).toHaveLength(2)
    expect(options[0]).toHaveTextContent('9')
    expect(options[0]).toHaveAttribute('aria-checked', 'true')
    expect(options[1]).toHaveTextContent('2')

    fireEvent.click(options[0])

    expect(onFiltersChange).toHaveBeenCalledWith(NO_SPACE_QUEUE_FILTERS)
  })

  it('removes the networks with the Network chip', () => {
    const filters = { ...NO_SPACE_QUEUE_FILTERS, chainIds: ['1'], signers: [signerA] }
    const onFiltersChange = renderToolbar(filters)

    const networkChip = screen.getByText('Network:').parentElement as HTMLElement
    fireEvent.click(within(networkChip).getByRole('button', { name: 'Remove' }))

    expect(onFiltersChange).toHaveBeenLastCalledWith({ ...filters, chainIds: [] })
  })

  it('removes the signers with the Signer chip', () => {
    const filters = { ...NO_SPACE_QUEUE_FILTERS, chainIds: ['1'], signers: [signerA] }
    const onFiltersChange = renderToolbar(filters)

    const signerChip = screen.getByText('Signer:').parentElement as HTMLElement
    fireEvent.click(within(signerChip).getByRole('button', { name: 'Remove' }))

    expect(onFiltersChange).toHaveBeenLastCalledWith({ ...filters, signers: [] })
  })

  it('shows no chips without filters', () => {
    renderToolbar()

    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument()
  })

  it('shows one chip per filter, naming up to two values', () => {
    renderToolbar({ statuses: ['sign', 'execute', 'blocked', 'conflicting'], safes: [], chainIds: [], signers: [] })

    expect(screen.getByText('Urgency:').parentElement).toHaveTextContent('Urgency:Ready to sign, Ready to execute +2')
  })

  it('removes the statuses with the Urgency chip', () => {
    const filters = {
      ...NO_SPACE_QUEUE_FILTERS,
      statuses: ['sign' as const],
      safes: [{ chainId: '1', safeAddress: safeA }],
    }
    const onFiltersChange = renderToolbar(filters)

    const statusChip = screen.getByText('Urgency:').parentElement as HTMLElement
    fireEvent.click(within(statusChip).getByRole('button', { name: 'Remove' }))

    expect(onFiltersChange).toHaveBeenLastCalledWith({ ...filters, statuses: [] })
  })

  it('removes every filter with Clear', () => {
    const onFiltersChange = renderToolbar({
      ...NO_SPACE_QUEUE_FILTERS,
      statuses: ['sign'],
      safes: [{ chainId: '1', safeAddress: safeA }],
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

    fireEvent.click(screen.getByRole('button', { name: 'Group by Urgency' }))
    fireEvent.click(screen.getByRole('menuitemradio', { name: /Up next/ }))

    expect(onGroupByChange).toHaveBeenCalledWith('next')
  })

  describe('search', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('passes the search on to the queue once typing pauses', () => {
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

      fireEvent.change(screen.getByRole('searchbox', { name: 'Search transactions' }), { target: { value: 'polygon' } })
      act(() => {
        jest.advanceTimersByTime(300)
      })

      expect(onSearchChange).toHaveBeenLastCalledWith('polygon')
    })
  })
})
