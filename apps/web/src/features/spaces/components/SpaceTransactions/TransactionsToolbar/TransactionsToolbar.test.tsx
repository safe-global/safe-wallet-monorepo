import { faker } from '@faker-js/faker'
import type { SpaceQueueCounts } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { fireEvent, render, screen, within } from '@/tests/test-utils'
import { NO_SPACE_QUEUE_FILTERS, type SpaceQueueFilters } from '../../../store/spaceQueueApi'
import TransactionsToolbar from '.'

jest.mock('../NewTransactionButton', () => ({ __esModule: true, default: () => null }))

const safeA = checksumAddress(faker.finance.ethereumAddress())
const safeB = checksumAddress(faker.finance.ethereumAddress())

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
    />,
  )
  return onFiltersChange
}

describe('TransactionsToolbar', () => {
  it('lists every status with its count and adds the one picked to the filters', () => {
    const onFiltersChange = renderToolbar({ statuses: ['execute'], safes: [] })

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

    expect(onFiltersChange).toHaveBeenCalledWith({ statuses: ['execute', 'sign'], safes: [] })
  })

  it('removes a status that is picked again', () => {
    const onFiltersChange = renderToolbar({ statuses: ['execute', 'sign'], safes: [] })

    fireEvent.click(screen.getByRole('button', { name: 'Status' }))
    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: /Execute/ }))

    expect(onFiltersChange).toHaveBeenCalledWith({ statuses: ['sign'], safes: [] })
  })

  it('lists the Safes by count and selects every chain of the one picked', () => {
    const onFiltersChange = renderToolbar()

    fireEvent.click(screen.getByRole('button', { name: 'Safe' }))
    const options = screen.getAllByRole('menuitemcheckbox')

    expect(options).toHaveLength(2)
    expect(options[0]).toHaveTextContent('8')
    expect(options[1]).toHaveTextContent('4')

    fireEvent.click(options[1])

    expect(onFiltersChange).toHaveBeenCalledWith({ statuses: [], safes: [{ chainId: '1', safeAddress: safeA }] })
  })

  it('shows no chips without filters', () => {
    renderToolbar()

    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument()
  })

  it('shows one chip per filter, naming up to two values', () => {
    renderToolbar({ statuses: ['sign', 'execute', 'blocked', 'conflicting'], safes: [] })

    expect(screen.getByText('Status:').parentElement).toHaveTextContent('Status:Ready to sign, Ready to execute +2')
  })

  it('removes one filter from its chip and every filter with Clear', () => {
    const onFiltersChange = renderToolbar({ statuses: ['sign'], safes: [{ chainId: '1', safeAddress: safeA }] })

    const statusChip = screen.getByText('Status:').parentElement as HTMLElement
    fireEvent.click(within(statusChip).getByRole('button', { name: 'Remove' }))
    expect(onFiltersChange).toHaveBeenLastCalledWith({ statuses: [], safes: [{ chainId: '1', safeAddress: safeA }] })

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(onFiltersChange).toHaveBeenLastCalledWith(NO_SPACE_QUEUE_FILTERS)
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
      />,
    )
    const searchbox = screen.getByRole('searchbox', { name: 'Search transactions' })

    expect(searchbox).toBeEnabled()
    fireEvent.change(searchbox, { target: { value: 'polygon' } })
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(onSearchChange).toHaveBeenLastCalledWith('')
  })
})
