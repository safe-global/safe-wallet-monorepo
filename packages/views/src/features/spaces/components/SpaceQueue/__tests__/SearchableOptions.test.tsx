import { useState } from 'react'
import userEvent from '@testing-library/user-event'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@safe-global/views/components/ui/dropdown-menu'
import { fireEvent, render, screen } from '@testing-library/react'
import SearchableOptions, {
  filterOptions,
} from '@safe-global/views/features/spaces/components/SpaceQueue/QueueFilters/SearchableOptions'

const NETWORKS = ['Ethereum', 'Polygon', 'Gnosis Chain', 'Base']

const NetworkMenu = ({ initialSelected = [] }: { initialSelected?: string[] }) => {
  const [selected, setSelected] = useState(initialSelected)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>Network</DropdownMenuTrigger>
      <DropdownMenuContent>
        <SearchableOptions items={NETWORKS} noun="networks" getText={(network) => network}>
          {(shown) =>
            shown.map((network) => (
              <DropdownMenuCheckboxItem
                key={network}
                checked={selected.includes(network)}
                onCheckedChange={(checked) =>
                  setSelected(checked ? [...selected, network] : selected.filter((other) => other !== network))
                }
              >
                {network}
              </DropdownMenuCheckboxItem>
            ))
          }
        </SearchableOptions>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const openMenu = async (initialSelected?: string[]) => {
  const user = userEvent.setup()
  render(<NetworkMenu initialSelected={initialSelected} />)
  fireEvent.click(screen.getByRole('button', { name: 'Network' }))
  return user
}

const optionNames = () => screen.queryAllByRole('menuitemcheckbox').map((option) => option.textContent)

describe('filterOptions', () => {
  it('keeps the items whose text holds the search, ignoring case and outer spaces', () => {
    expect(filterOptions(NETWORKS, (network) => network, '  GNO ')).toEqual(['Gnosis Chain'])
  })

  it('keeps every item without a search', () => {
    expect(filterOptions(NETWORKS, (network) => network, '   ')).toEqual(NETWORKS)
  })
})

describe('SearchableOptions', () => {
  it('narrows the options while the user types', async () => {
    const user = await openMenu()

    await user.type(screen.getByRole('searchbox', { name: 'Search networks' }), 'o')
    expect(optionNames()).toEqual(['Polygon', 'Gnosis Chain'])

    await user.type(screen.getByRole('searchbox', { name: 'Search networks' }), 'l')
    expect(optionNames()).toEqual(['Polygon'])
  })

  it('says so when nothing matches', async () => {
    const user = await openMenu()

    await user.type(screen.getByRole('searchbox', { name: 'Search networks' }), 'solana')

    expect(optionNames()).toEqual([])
    expect(screen.getByText('No matches')).toBeInTheDocument()
  })

  it('keeps the selection while the search changes', async () => {
    const user = await openMenu(['Polygon'])
    const search = screen.getByRole('searchbox', { name: 'Search networks' })

    await user.type(search, 'eth')
    await user.click(screen.getByRole('menuitemcheckbox', { name: 'Ethereum' }))
    await user.click(screen.getByRole('button', { name: 'Clear search' }))

    expect(optionNames()).toEqual(NETWORKS)
    expect(screen.getByRole('menuitemcheckbox', { name: 'Ethereum' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('menuitemcheckbox', { name: 'Polygon' })).toHaveAttribute('aria-checked', 'true')
  })

  it('puts the options in a scroll area below the search field', async () => {
    await openMenu()
    const search = screen.getByRole('searchbox', { name: 'Search networks' })
    const list = screen.getByRole('menuitemcheckbox', { name: 'Ethereum' }).parentElement

    expect(list).toHaveClass('max-h-72', 'overflow-y-auto')
    expect(list).not.toContainElement(search)
  })

  it('works with the keyboard alone: type, move to the options, pick one and come back', async () => {
    const user = await openMenu()
    const search = screen.getByRole('searchbox', { name: 'Search networks' })

    screen.getByRole('menuitemcheckbox', { name: 'Ethereum' }).focus()
    await user.keyboard('po')
    expect(search).toHaveFocus()
    expect(search).toHaveValue('po')
    expect(optionNames()).toEqual(['Polygon'])

    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitemcheckbox', { name: 'Polygon' })).toHaveFocus()

    await user.keyboard(' ')
    expect(screen.getByRole('menuitemcheckbox', { name: 'Polygon' })).toHaveAttribute('aria-checked', 'true')

    await user.keyboard('{ArrowUp}')
    expect(search).toHaveFocus()
  })
})
