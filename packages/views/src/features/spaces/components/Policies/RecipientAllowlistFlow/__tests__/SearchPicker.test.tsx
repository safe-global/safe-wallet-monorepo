import { useState } from 'react'
import { faker } from '@faker-js/faker'
import { renderWithUserEvent, screen, within } from '@/tests/test-utils'
import SearchPicker, { type SearchPickerItem, type SearchPickerProps } from '../SearchPicker'

const PLACEHOLDER = 'Search tokens by name or address'

const item = (label: string, overrides: Partial<SearchPickerItem> = {}): SearchPickerItem => ({
  id: faker.finance.ethereumAddress().toLowerCase(),
  label,
  detail: faker.finance.currencyName(),
  icon: <span />,
  ...overrides,
})

const USDC = item('USDC', { detail: 'USD Coin' })
const DAI = item('DAI', { detail: 'Dai Stablecoin' })
const ETH = item('ETH', { detail: 'Ether' })

const Picker = (props: Partial<SearchPickerProps>) => {
  const [query, setQuery] = useState(props.query ?? '')
  return (
    <SearchPicker
      placeholder={PLACEHOLDER}
      groups={[{ id: 'tokens', items: [USDC, DAI, ETH] }]}
      selected={[]}
      onToggle={jest.fn()}
      emptyLabel="No tokens found"
      {...props}
      query={query}
      onQueryChange={(next) => {
        setQuery(next)
        props.onQueryChange?.(next)
      }}
    />
  )
}

const field = () => screen.getByRole('combobox', { name: PLACEHOLDER })
const optionLabels = () => screen.queryAllByRole('option').map((option) => option.textContent)

describe('SearchPicker', () => {
  it('should, when the field is not focused, list nothing', () => {
    renderWithUserEvent(<Picker />)

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(field()).toHaveAttribute('aria-expanded', 'false')
  })

  it('should, when the field is focused, list every item with its detail', async () => {
    const { user } = renderWithUserEvent(<Picker />)

    await user.click(field())

    expect(field()).toHaveAttribute('aria-expanded', 'true')
    expect(optionLabels()).toEqual([
      `${USDC.label}${USDC.detail}`,
      `${DAI.label}${DAI.detail}`,
      `${ETH.label}${ETH.detail}`,
    ])
  })

  it('should, when the user types, list only the items whose label, detail or search text match', async () => {
    const byAddress = item('WETH', { searchText: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' })
    const { user } = renderWithUserEvent(<Picker groups={[{ id: 'tokens', items: [USDC, DAI, byAddress] }]} />)

    await user.type(field(), 'c02aaa')

    expect(screen.getAllByRole('option')).toHaveLength(1)
    expect(screen.getByRole('option', { name: /WETH/ })).toBeInTheDocument()
  })

  it('should, when nothing matches, show the empty label', async () => {
    const { user } = renderWithUserEvent(<Picker />)

    await user.type(field(), 'zzz')

    expect(screen.queryAllByRole('option')).toHaveLength(0)
    expect(screen.getByText('No tokens found')).toBeInTheDocument()
  })

  it('should, when an option is clicked, toggle it and keep the list open', async () => {
    const onToggle = jest.fn()
    const { user } = renderWithUserEvent(<Picker onToggle={onToggle} selected={[USDC.id]} />)

    await user.click(field())
    await user.click(screen.getByRole('option', { name: /DAI/ }))

    expect(onToggle).toHaveBeenCalledWith(DAI)
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /USDC/ })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('option', { name: /DAI/ })).toHaveAttribute('aria-selected', 'false')
  })

  it('should, when Enter is pressed, pick the first listed option', async () => {
    const onToggle = jest.fn()
    const { user } = renderWithUserEvent(<Picker onToggle={onToggle} />)

    await user.type(field(), 'ai')
    await user.keyboard('{Enter}')

    expect(onToggle).toHaveBeenCalledWith(DAI)
  })

  it('should, when the arrow keys move to an option, pick that one on Enter', async () => {
    const onToggle = jest.fn()
    const { user } = renderWithUserEvent(<Picker onToggle={onToggle} />)

    await user.click(field())
    await user.keyboard('{ArrowDown}{ArrowDown}')

    expect(field()).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: /DAI/ }).id)

    await user.keyboard('{Enter}')

    expect(onToggle).toHaveBeenCalledWith(DAI)
  })

  it('should, when Escape is pressed, close the list', async () => {
    const { user } = renderWithUserEvent(<Picker />)

    await user.click(field())
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(field()).toHaveFocus()
  })

  it('should, when the field loses focus, close the list', async () => {
    const { user } = renderWithUserEvent(
      <>
        <Picker />
        <button type="button">elsewhere</button>
      </>,
    )

    await user.click(field())
    await user.click(screen.getByRole('button', { name: 'elsewhere' }))

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('should, when some listed items are picked, show Select all as mixed and pick the rest', async () => {
    const onSelectAll = jest.fn()
    const { user } = renderWithUserEvent(<Picker selected={[USDC.id]} onSelectAll={onSelectAll} />)

    await user.click(field())
    const selectAll = screen.getByRole('button', { name: 'Select all' })

    expect(within(selectAll).getByRole('checkbox')).toHaveAttribute('aria-checked', 'mixed')

    await user.click(selectAll)

    expect(onSelectAll).toHaveBeenCalledWith([USDC.id, DAI.id, ETH.id], true)
  })

  it('should, when every listed item is picked, unpick only the listed ones with Select all', async () => {
    const onSelectAll = jest.fn()
    const { user } = renderWithUserEvent(<Picker selected={[USDC.id, DAI.id]} onSelectAll={onSelectAll} />)

    await user.type(field(), 's')
    await user.click(screen.getByRole('button', { name: 'Select all' }))

    expect(onSelectAll).toHaveBeenCalledWith([USDC.id, DAI.id], false)
  })

  it('should, when a single item is listed, offer no Select all', async () => {
    const { user } = renderWithUserEvent(<Picker onSelectAll={jest.fn()} />)

    await user.type(field(), 'ai')

    expect(screen.queryByRole('button', { name: 'Select all' })).not.toBeInTheDocument()
  })

  it('should, when given an extra item, list it first and clear the query once it is picked', async () => {
    const pasted = faker.finance.ethereumAddress()
    const extra = item('New recipient', { id: pasted.toLowerCase(), detail: pasted, isDetailAddress: true })
    const onToggle = jest.fn()
    const onQueryChange = jest.fn()
    const { user } = renderWithUserEvent(
      <Picker query={pasted} extraItem={extra} onToggle={onToggle} onQueryChange={onQueryChange} />,
    )

    await user.click(field())

    expect(screen.getAllByRole('option')[0]).toHaveTextContent(`New recipient${pasted}`)

    await user.click(screen.getByRole('option', { name: /New recipient/ }))

    expect(onToggle).toHaveBeenCalledWith(extra)
    expect(onQueryChange).toHaveBeenLastCalledWith('')
  })

  it('should, when given a notice, show it instead of the empty label and offer its retry', async () => {
    const onRetry = jest.fn()
    const { user } = renderWithUserEvent(
      <Picker query="0x0000000000000000000000000000000000000000" notice={{ text: 'Not valid', onRetry }} />,
    )

    await user.click(field())

    expect(screen.getByRole('alert')).toHaveTextContent('Not valid')
    expect(screen.queryByText('No tokens found')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Retry' }))

    expect(onRetry).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('should, when loading, show skeleton rows instead of the empty label', async () => {
    const { user } = renderWithUserEvent(<Picker groups={[]} isLoading />)

    await user.click(field())

    expect(screen.getByTestId('search-picker-loading')).toBeInTheDocument()
    expect(screen.queryByText('No tokens found')).not.toBeInTheDocument()
  })

  it('should, when the groups have headers, label each group by its header', async () => {
    const { user } = renderWithUserEvent(
      <Picker
        groups={[
          { id: 'workspace', header: <span>Workspace contacts</span>, items: [USDC] },
          { id: 'local', header: <span>Local contacts</span>, items: [DAI] },
        ]}
      />,
    )

    await user.click(field())

    expect(within(screen.getByRole('group', { name: 'Local contacts' })).getByRole('option')).toHaveTextContent('DAI')
  })

  it('should, when disabled, not open the list', async () => {
    const { user } = renderWithUserEvent(<Picker disabled />)

    await user.click(field())

    expect(field()).toBeDisabled()
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
