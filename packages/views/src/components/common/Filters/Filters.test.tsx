import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  AppliedFilters,
  FilterDropdown,
  FilterDropdownNote,
  FilterMenu,
  useFilterSelection,
  type FilterDimension,
  type FilterSelection,
} from '@safe-global/views/components/common/Filters'

const status: FilterDimension = {
  id: 'status',
  label: 'Status',
  options: [
    { value: 'execute', label: 'Execute', count: 3 },
    { value: 'sign', label: 'Sign', count: 5 },
    { value: 'waiting', label: 'Waiting', count: 0 },
  ],
}

const safe: FilterDimension = {
  id: 'safe',
  label: 'Safe',
  options: [
    { value: 'treasury', label: 'Treasury' },
    { value: 'grants', label: 'Grants' },
  ],
}

const dimensions = [status, safe]

function Toolbar({ initial }: { initial?: FilterSelection }) {
  const filters = useFilterSelection(initial)
  return (
    <>
      <FilterDropdown
        dimension={status}
        selected={filters.selection.status ?? []}
        onToggle={(value) => filters.toggle('status', value)}
        onClear={() => filters.clear('status')}
      />
      <FilterMenu
        dimensions={dimensions}
        selection={filters.selection}
        onToggle={filters.toggle}
        onReset={filters.reset}
      />
      <AppliedFilters
        dimensions={dimensions}
        selection={filters.selection}
        onRemove={filters.clear}
        onClearAll={filters.reset}
      />
    </>
  )
}

const openStatusDropdown = () => userEvent.click(screen.getByRole('button', { name: 'Status' }))

const openMenuSection = async (label: string) => {
  await userEvent.click(screen.getByRole('button', { name: 'Filter' }))
  await userEvent.click(await screen.findByRole('menuitem', { name: new RegExp(`^${label}`) }))
}

describe('FilterDropdown', () => {
  it('renders one trigger button with the label only', () => {
    render(
      <FilterDropdown dimension={status} selected={['sign', 'execute']} onToggle={jest.fn()} onClear={jest.fn()} />,
    )

    expect(screen.getAllByRole('button')).toHaveLength(1)
    expect(screen.getByRole('button')).toHaveTextContent(/^Status$/)
  })

  it('lists options with counts and toggles a value', async () => {
    const onToggle = jest.fn()
    render(<FilterDropdown dimension={status} selected={['sign']} onToggle={onToggle} onClear={jest.fn()} />)

    await openStatusDropdown()
    const sign = await screen.findByRole('menuitemcheckbox', { name: /Sign/ })
    expect(sign).toHaveAttribute('aria-checked', 'true')
    expect(sign).toHaveTextContent('5')
    expect(screen.getByRole('menuitemcheckbox', { name: /Execute/ })).toHaveAttribute('aria-checked', 'false')

    await userEvent.click(screen.getByRole('menuitemcheckbox', { name: /Waiting/ }))
    expect(onToggle).toHaveBeenCalledWith('waiting')
  })

  it('hides the Clear row when nothing is selected', async () => {
    render(<FilterDropdown dimension={status} selected={[]} onToggle={jest.fn()} onClear={jest.fn()} />)

    await openStatusDropdown()
    await screen.findByRole('menuitemcheckbox', { name: /Sign/ })
    expect(screen.queryByRole('menuitem', { name: /Clear/ })).not.toBeInTheDocument()
  })

  it('shows Clear with the selected count and clears', async () => {
    const onClear = jest.fn()
    render(<FilterDropdown dimension={status} selected={['sign', 'execute']} onToggle={jest.fn()} onClear={onClear} />)

    await openStatusDropdown()
    const clear = await screen.findByRole('menuitem', { name: /Clear/ })
    expect(clear).toHaveTextContent('2 selected')

    await userEvent.click(clear)
    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('renders the footer below the options', async () => {
    render(
      <FilterDropdown
        dimension={safe}
        selected={[]}
        onToggle={jest.fn()}
        onClear={jest.fn()}
        footer={<FilterDropdownNote>Sorted by actionable transactions</FilterDropdownNote>}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Safe' }))
    expect(await screen.findByText('Sorted by actionable transactions')).toBeInTheDocument()
  })
})

describe('FilterMenu', () => {
  it('shows only the count on a filtering section', async () => {
    render(
      <FilterMenu dimensions={dimensions} selection={{ safe: ['grants'] }} onToggle={jest.fn()} onReset={jest.fn()} />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Filter' }))
    const safeSection = await screen.findByRole('menuitem', { name: /^Safe/ })
    expect(safeSection).toHaveTextContent(/^Safe1$/)
    expect(safeSection).not.toHaveTextContent('Grants')
    expect(screen.getByRole('menuitem', { name: /^Status/ })).toHaveTextContent(/^Status$/)
  })

  it('hides Reset all filters when nothing is applied', async () => {
    render(<FilterMenu dimensions={dimensions} selection={{}} onToggle={jest.fn()} onReset={jest.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: 'Filter' }))
    await screen.findByRole('menuitem', { name: /^Safe/ })
    expect(screen.queryByRole('menuitem', { name: /Reset all filters/ })).not.toBeInTheDocument()
  })

  it('shows Reset all filters with the applied count and resets', async () => {
    const onReset = jest.fn()
    render(
      <FilterMenu
        dimensions={dimensions}
        selection={{ status: ['sign', 'execute'], safe: ['grants'] }}
        onToggle={jest.fn()}
        onReset={onReset}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Filter' }))
    const reset = await screen.findByRole('menuitem', { name: /Reset all filters/ })
    expect(reset).toHaveTextContent('2 applied')

    await userEvent.click(reset)
    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it('toggles an option with its dimension id', async () => {
    const onToggle = jest.fn()
    render(<FilterMenu dimensions={dimensions} selection={{}} onToggle={onToggle} onReset={jest.fn()} />)

    await openMenuSection('Safe')
    await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: /Grants/ }))
    expect(onToggle).toHaveBeenCalledWith('safe', 'grants')
  })
})

describe('AppliedFilters', () => {
  it('renders nothing when no filter is applied', () => {
    const { container } = render(
      <AppliedFilters dimensions={dimensions} selection={{}} onRemove={jest.fn()} onClearAll={jest.fn()} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders one chip per dimension, removes one and clears all', async () => {
    const onRemove = jest.fn()
    const onClearAll = jest.fn()
    render(
      <AppliedFilters
        dimensions={dimensions}
        selection={{ status: ['waiting', 'sign', 'execute'], safe: ['grants'] }}
        onRemove={onRemove}
        onClearAll={onClearAll}
      />,
    )

    const group = screen.getByRole('group', { name: 'Applied filters' })
    expect(group).toHaveTextContent('Status:Execute, Sign +1')
    expect(group).toHaveTextContent('Safe:Grants')

    await userEvent.click(within(group).getAllByRole('button', { name: 'Remove' })[1])
    expect(onRemove).toHaveBeenCalledWith('safe')

    await userEvent.click(within(group).getByRole('button', { name: 'Clear' }))
    expect(onClearAll).toHaveBeenCalledTimes(1)
  })
})

describe('shared selection', () => {
  it('shows a dropdown selection as checked in the Filter menu', async () => {
    render(<Toolbar />)

    await openStatusDropdown()
    await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: /Sign/ }))
    await userEvent.keyboard('{Escape}')

    await openMenuSection('Status')
    expect(await screen.findByRole('menuitemcheckbox', { name: /Sign/ })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('menuitemcheckbox', { name: /Execute/ })).toHaveAttribute('aria-checked', 'false')
  })

  it('removes a chip and unchecks its options', async () => {
    render(<Toolbar initial={{ status: ['sign'], safe: ['grants'] }} />)

    const group = screen.getByRole('group', { name: 'Applied filters' })
    await userEvent.click(within(group).getAllByRole('button', { name: 'Remove' })[0])
    expect(group).not.toHaveTextContent('Status:')

    await openStatusDropdown()
    expect(await screen.findByRole('menuitemcheckbox', { name: /Sign/ })).toHaveAttribute('aria-checked', 'false')
  })

  it('reset all clears every chip', async () => {
    render(<Toolbar initial={{ status: ['sign'], safe: ['grants'] }} />)

    await userEvent.click(screen.getByRole('button', { name: 'Filter' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: /Reset all filters/ }))
    expect(screen.queryByRole('group', { name: 'Applied filters' })).not.toBeInTheDocument()
  })
})
