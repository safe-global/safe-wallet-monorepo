import type { ReactNode } from 'react'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { render, screen, fireEvent } from '@/tests/test-utils'
import NetworkSelector from './index'

const mockChain = (chainId: string, chainName: string, isTestnet = false) =>
  ({
    chainId,
    chainName,
    shortName: chainName.slice(0, 3).toLowerCase(),
    isTestnet,
    chainLogoUri: null,
    theme: { backgroundColor: '#fff', textColor: '#000' },
  }) as Chain

const mockChains = [
  mockChain('1', 'Ethereum'),
  mockChain('137', 'Polygon'),
  mockChain('100', 'Gnosis Chain'),
  mockChain('11155111', 'Sepolia', true),
]

// The real Base UI Select keeps its popup in a portal that synthetic clicks don't reliably open in
// jsdom, so the popup parts render inline here and a bare button drives `onOpenChange`. Mirrors the
// stub in SafeSelectorDropdown's own container test.
jest.mock('@/components/ui/select', () => ({
  __esModule: true,
  Select: ({
    children,
    open,
    onOpenChange,
  }: {
    children?: ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }) => (
    <div data-testid="select-root">
      <button type="button" data-testid="select-toggle" onClick={() => onOpenChange?.(!open)} />
      {children}
    </div>
  ),
  SelectTrigger: ({ children }: { children?: ReactNode }) => <div data-slot="select-trigger">{children}</div>,
  SelectValue: ({ children }: { children?: ReactNode | (() => ReactNode) }) => (
    <div data-slot="select-value">{typeof children === 'function' ? children() : children}</div>
  ),
  SelectContent: ({ children, className }: { children?: ReactNode; className?: string }) => (
    <div data-slot="select-content" data-testid="select-content" className={className}>
      {children}
    </div>
  ),
  // The data-slot and tabIndex mirror the real primitive: the component finds rows by that slot, and
  // jsdom refuses to focus a div without a tabindex.
  SelectItem: ({ children, value, ...props }: { children?: ReactNode; value?: string }) => (
    <div data-slot="select-item" data-value={value} tabIndex={-1} {...props}>
      {children}
    </div>
  ),
}))

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: mockChains, error: undefined, loading: false }),
  useChain: (chainId: string) => mockChains.find((chain) => chain.chainId === chainId),
  useCurrentChain: () => mockChains[0],
}))

jest.mock('@/hooks/useChainId', () => ({
  __esModule: true,
  default: () => '1',
}))

jest.mock('@/hooks/useSafeAddress', () => ({
  __esModule: true,
  default: () => '',
}))

jest.mock('@/hooks/safes', () => ({
  useAllSafesGrouped: () => ({ allMultiChainSafes: [], allSingleSafes: [] }),
}))

jest.mock('@/hooks/useAddressBook', () => ({
  __esModule: true,
  default: () => ({}),
}))

jest.mock('@/features/multichain', () => ({
  __esModule: true,
  hasMultiChainAddNetworkFeature: () => false,
  useSafeCreationData: () => [undefined, undefined, false],
  CreateSafeOnSpecificChain: () => null,
}))

const getSearchInput = () => screen.getByTestId('network-selector-search-input')

const getListedNetworks = () => screen.getAllByTestId('network-selector-item').map((item) => item.textContent?.trim())

describe('NetworkSelector', () => {
  it('renders a search field at the top of the dropdown', () => {
    render(<NetworkSelector />)

    const search = getSearchInput()
    expect(search).toBeInTheDocument()
    expect(search).toHaveAttribute('placeholder', 'Search networks')

    // "At the top" is the contract the ticket asks for: the field must precede the first network row.
    const content = screen.getByTestId('select-content')
    const rows = screen.getAllByTestId('network-selector-item')
    expect(content.firstElementChild).toContainElement(search)
    expect(search.compareDocumentPosition(rows[0]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('lists every available network while the search is empty', () => {
    render(<NetworkSelector />)

    expect(getListedNetworks()).toHaveLength(mockChains.length)
  })

  it('filters the listed networks by the typed term', () => {
    render(<NetworkSelector />)

    fireEvent.change(getSearchInput(), { target: { value: 'gnosis' } })

    expect(getListedNetworks()).toEqual(['Gnosis Chain'])
    // A partial match must not also claim there are no matches.
    expect(screen.queryByTestId('network-selector-empty')).not.toBeInTheDocument()
  })

  it('matches network names case-insensitively', () => {
    render(<NetworkSelector />)

    fireEvent.change(getSearchInput(), { target: { value: 'POLY' } })

    expect(getListedNetworks()).toEqual(['Polygon'])
    expect(screen.queryByTestId('network-selector-empty')).not.toBeInTheDocument()
  })

  it('keeps a filtered network selectable, with its link intact', () => {
    render(<NetworkSelector />)

    fireEvent.change(getSearchInput(), { target: { value: 'polygon' } })

    const row = screen.getByTestId('network-selector-item')
    expect(row).toHaveAttribute('data-value', '137')
    // The row's link is what performs the switch; a filtered row must still carry it.
    expect(row.querySelector('a')).toHaveAttribute('href', expect.stringContaining('pol'))
  })

  it('shows an empty state when nothing matches', () => {
    render(<NetworkSelector />)

    fireEvent.change(getSearchInput(), { target: { value: 'no-such-network' } })

    expect(screen.queryAllByTestId('network-selector-item')).toHaveLength(0)
    expect(screen.getByTestId('network-selector-empty')).toHaveTextContent('No networks match your search')
  })

  it('does not show the empty state when the search is empty', () => {
    render(<NetworkSelector />)

    expect(screen.queryByTestId('network-selector-empty')).not.toBeInTheDocument()
  })

  it('hides the testnet divider when no testnet matches', () => {
    render(<NetworkSelector />)
    expect(screen.getByText('Testnets')).toBeInTheDocument()

    fireEvent.change(getSearchInput(), { target: { value: 'ethereum' } })

    expect(screen.queryByText('Testnets')).not.toBeInTheDocument()
  })

  it('still groups a matching testnet under the divider', () => {
    render(<NetworkSelector />)

    fireEvent.change(getSearchInput(), { target: { value: 'sepolia' } })

    expect(screen.getByText('Testnets')).toBeInTheDocument()
    expect(getListedNetworks()).toEqual(['Sepolia'])
    expect(screen.queryByTestId('network-selector-empty')).not.toBeInTheDocument()
  })

  it('clears the search when the dropdown is reopened', () => {
    render(<NetworkSelector />)

    fireEvent.change(getSearchInput(), { target: { value: 'gnosis' } })
    expect(getListedNetworks()).toEqual(['Gnosis Chain'])

    const toggle = screen.getByTestId('select-toggle')
    fireEvent.click(toggle) // open
    fireEvent.click(toggle) // close

    expect(getSearchInput()).toHaveValue('')
    expect(getListedNetworks()).toHaveLength(mockChains.length)
  })

  // Base UI's Select reads printable keys as list typeahead from a handler above the input, so those
  // must not reach it. Escape must, or the popup can no longer close.
  const renderWithAncestorKeyDown = () => {
    const onAncestorKeyDown = jest.fn()
    render(
      <div onKeyDown={onAncestorKeyDown}>
        <NetworkSelector />
      </div>,
    )
    return onAncestorKeyDown
  }

  it.each(['g', '1', ' ', 'Enter', 'Tab'])('stops the %s key from reaching the Select above it', (key) => {
    const onAncestorKeyDown = renderWithAncestorKeyDown()

    fireEvent.keyDown(getSearchInput(), { key })

    expect(onAncestorKeyDown).not.toHaveBeenCalled()
  })

  it('lets Escape reach the Select above it', () => {
    const onAncestorKeyDown = renderWithAncestorKeyDown()

    fireEvent.keyDown(getSearchInput(), { key: 'Escape' })

    expect(onAncestorKeyDown).toHaveBeenCalledWith(expect.objectContaining({ key: 'Escape' }))
  })

  // The arrows are handled here rather than passed up: base-ui tracks the highlighted row by index and
  // never re-derives it when the list filters, so navigating from its stale position lands on the wrong
  // row — or nowhere. Focusing a row we picked makes that row's own onFocus write the correct index back.
  it('moves focus to the first matching row on ArrowDown, without reaching the Select', () => {
    const onAncestorKeyDown = renderWithAncestorKeyDown()
    fireEvent.change(getSearchInput(), { target: { value: 'pol' } })

    fireEvent.keyDown(getSearchInput(), { key: 'ArrowDown' })

    expect(document.activeElement).toBe(screen.getAllByTestId('network-selector-item')[0])
    expect(document.activeElement).toHaveTextContent('Polygon')
    expect(onAncestorKeyDown).not.toHaveBeenCalled()
  })

  it('moves focus to the last matching row on ArrowUp', () => {
    render(<NetworkSelector />)
    fireEvent.change(getSearchInput(), { target: { value: 'o' } })

    fireEvent.keyDown(getSearchInput(), { key: 'ArrowUp' })

    const rows = screen.getAllByTestId('network-selector-item')
    expect(document.activeElement).toBe(rows[rows.length - 1])
  })

  it('does not move focus on ArrowDown when nothing matches', () => {
    render(<NetworkSelector />)
    const search = getSearchInput()
    fireEvent.change(search, { target: { value: 'no-such-network' } })
    search.focus()

    fireEvent.keyDown(search, { key: 'ArrowDown' })

    expect(document.activeElement).toBe(search)
  })
})
