import React, { act } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SafeDropdownContainer from '../SafeDropdownContainer'
import type { SafeItemData } from '../../types'

// Resolver is exercised in its own unit test; here we stub it so the component renders without a
// store. Default behaviour mirrors production: the safe's own name wins, else the address-book name.
const mockAddressBookNames: Record<string, string> = {}
const mockUseWallet = jest.fn()
jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: () => mockUseWallet(),
}))

jest.mock('@/hooks/useAllAddressBooks', () => ({
  useSafeNameResolver:
    () =>
    (address: string, _chainId: string | undefined, preferredName?: string): string =>
      preferredName || mockAddressBookNames[address.toLowerCase()] || '',
}))

// jsdom doesn't implement ResizeObserver; the component uses one to catch popup
// size changes. A noop stub is enough since tests drive scroll state explicitly.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
;(globalThis as unknown as { ResizeObserver: typeof ResizeObserverStub }).ResizeObserver = ResizeObserverStub

// Render SelectContent as a plain div carrying the `data-slot` marker that the
// component's `closest()` lookup relies on, so the scroll-hint effect can find it.
jest.mock('@/components/ui/select', () => ({
  __esModule: true,
  SelectContent: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
    <div data-slot="select-content" data-testid="select-content" className={className}>
      {children}
    </div>
  ),
  SelectItem: ({ children, value }: { children?: React.ReactNode; value?: string }) => (
    <div data-testid="select-item" data-value={value}>
      {children}
    </div>
  ),
}))

jest.mock('../SafeItem', () => ({
  __esModule: true,
  default: ({ name }: { name: string }) => <div data-testid="safe-item">{name}</div>,
}))

jest.mock('../MultiChainSafeItemRow', () => ({
  __esModule: true,
  default: ({ item }: { item: SafeItemData }) => <div data-testid="multi-chain-row">{item.name}</div>,
}))

// Redux-backed; stubbed here so the container test doesn't need a store.
jest.mock('@/components/common/SafeListSortToggle', () => ({
  __esModule: true,
  default: () => <div data-testid="safe-list-sort-toggle" />,
}))

const createItem = (overrides: Partial<SafeItemData> = {}): SafeItemData => ({
  id: '1:0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  name: 'Safe A',
  address: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  threshold: 1,
  owners: 2,
  balance: '100',
  chains: [{ chainId: '1', chainName: 'Ethereum', chainLogoUri: null, shortName: 'eth' }],
  ...overrides,
})

const setScrollMetrics = (
  el: HTMLElement,
  { scrollHeight, clientHeight, scrollTop }: { scrollHeight: number; clientHeight: number; scrollTop: number },
) => {
  Object.defineProperty(el, 'scrollHeight', { configurable: true, value: scrollHeight })
  Object.defineProperty(el, 'clientHeight', { configurable: true, value: clientHeight })
  Object.defineProperty(el, 'scrollTop', { configurable: true, writable: true, value: scrollTop })
}

const fireScroll = (el: HTMLElement) => {
  act(() => {
    el.dispatchEvent(new Event('scroll'))
  })
}

describe('SafeDropdownContainer', () => {
  beforeEach(() => {
    mockUseWallet.mockReturnValue({ address: '0x1234567890123456789012345678901234567890' })
  })

  describe('empty state', () => {
    it('prompts to connect a wallet when there are no safes and no wallet is connected', () => {
      mockUseWallet.mockReturnValue(null)

      render(<SafeDropdownContainer items={[]} onItemSelect={jest.fn()} closeDropdown={jest.fn()} />)

      expect(screen.getByTestId('dropdown-empty')).toHaveTextContent('Connect a wallet to find your Safe Accounts')
    })

    it('shows "No safes yet" when there are no safes but a wallet is connected', () => {
      mockUseWallet.mockReturnValue({ address: '0x1234567890123456789012345678901234567890' })

      render(<SafeDropdownContainer items={[]} onItemSelect={jest.fn()} closeDropdown={jest.fn()} />)

      expect(screen.getByTestId('dropdown-empty')).toHaveTextContent('No safes yet')
    })
  })

  describe('footer', () => {
    it('renders the footer node when provided', () => {
      render(
        <SafeDropdownContainer
          items={[createItem()]}
          onItemSelect={jest.fn()}
          closeDropdown={jest.fn()}
          footer={<div data-testid="footer-node">All Accounts</div>}
        />,
      )

      expect(screen.getByTestId('footer-node')).toBeInTheDocument()
    })

    it('invokes the footer callback with closeDropdown when footer is a function', () => {
      const closeDropdown = jest.fn()
      const footerFn = jest.fn(() => <div data-testid="footer-node">FooterFn</div>)

      render(
        <SafeDropdownContainer
          items={[createItem()]}
          onItemSelect={jest.fn()}
          closeDropdown={closeDropdown}
          footer={footerFn}
        />,
      )

      expect(footerFn).toHaveBeenCalledWith(closeDropdown)
      expect(screen.getByTestId('footer-node')).toBeInTheDocument()
    })

    it('does not render the footer wrapper when no footer prop is passed', () => {
      render(<SafeDropdownContainer items={[createItem()]} onItemSelect={jest.fn()} closeDropdown={jest.fn()} />)

      expect(screen.queryByTestId('scroll-hint')).not.toBeInTheDocument()
    })
  })

  describe('search', () => {
    const itemA = createItem({
      id: '1:0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      name: 'Alpha Treasury',
      address: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      chains: [{ chainId: '1', chainName: 'Ethereum', chainLogoUri: null, shortName: 'eth' }],
    })
    const itemB = createItem({
      id: '137:0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      name: 'Beta Ops',
      address: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      chains: [{ chainId: '137', chainName: 'Polygon', chainLogoUri: null, shortName: 'matic' }],
    })

    const renderWithSearch = () =>
      render(<SafeDropdownContainer items={[itemA, itemB]} onItemSelect={jest.fn()} closeDropdown={jest.fn()} />)

    beforeEach(() => {
      for (const key of Object.keys(mockAddressBookNames)) delete mockAddressBookNames[key]
    })

    it('renders the search input when there are items', () => {
      renderWithSearch()
      expect(screen.getByTestId('safe-dropdown-search-input')).toBeInTheDocument()
    })

    it('hides the search input when the only safe is the currently-selected one', () => {
      render(
        <SafeDropdownContainer
          items={[createItem({ id: '1:0xaaaa', address: '0xaaaa' })]}
          selectedItemId="1:0xaaaa"
          onItemSelect={jest.fn()}
          closeDropdown={jest.fn()}
        />,
      )

      expect(screen.queryByTestId('safe-dropdown-search-input')).not.toBeInTheDocument()
      expect(screen.getByTestId('dropdown-empty')).toHaveTextContent('No safes yet')
    })

    it('keeps the search input visible when a query matches nothing', async () => {
      renderWithSearch()
      await userEvent.type(screen.getByTestId('safe-dropdown-search-input'), 'nonexistent')

      expect(screen.getByTestId('safe-dropdown-search-input')).toBeInTheDocument()
    })

    it('does not render the search input on error', () => {
      render(
        <SafeDropdownContainer
          items={[itemA]}
          onItemSelect={jest.fn()}
          closeDropdown={jest.fn()}
          isError
          onRetry={jest.fn()}
        />,
      )
      expect(screen.queryByTestId('safe-dropdown-search-input')).not.toBeInTheDocument()
    })

    it('filters by name', async () => {
      renderWithSearch()
      await userEvent.type(screen.getByTestId('safe-dropdown-search-input'), 'alpha')

      expect(screen.getByText('Alpha Treasury')).toBeInTheDocument()
      expect(screen.queryByText('Beta Ops')).not.toBeInTheDocument()
    })

    it('filters by address', async () => {
      renderWithSearch()
      await userEvent.type(screen.getByTestId('safe-dropdown-search-input'), '0xbbbb')

      expect(screen.getByText('Beta Ops')).toBeInTheDocument()
      expect(screen.queryByText('Alpha Treasury')).not.toBeInTheDocument()
    })

    it('filters by chain name', async () => {
      renderWithSearch()
      await userEvent.type(screen.getByTestId('safe-dropdown-search-input'), 'polygon')

      expect(screen.getByText('Beta Ops')).toBeInTheDocument()
      expect(screen.queryByText('Alpha Treasury')).not.toBeInTheDocument()
    })

    it('filters by chain short name', async () => {
      renderWithSearch()
      await userEvent.type(screen.getByTestId('safe-dropdown-search-input'), 'matic')

      expect(screen.getByText('Beta Ops')).toBeInTheDocument()
      expect(screen.queryByText('Alpha Treasury')).not.toBeInTheDocument()
    })

    it('filters by the address-book name when the safe itself is unnamed', async () => {
      const unnamed = createItem({
        id: '1:0xcccccccccccccccccccccccccccccccccccccccc',
        name: '',
        address: '0xcccccccccccccccccccccccccccccccccccccccc',
        chains: [{ chainId: '1', chainName: 'Ethereum', chainLogoUri: null, shortName: 'eth' }],
      })
      mockAddressBookNames['0xcccccccccccccccccccccccccccccccccccccccc'] = 'Cold Storage'

      render(<SafeDropdownContainer items={[itemA, unnamed]} onItemSelect={jest.fn()} closeDropdown={jest.fn()} />)
      await userEvent.type(screen.getByTestId('safe-dropdown-search-input'), 'cold')

      // The unnamed safe (resolved via address book) survives; the named one is filtered out.
      expect(screen.queryByText('Alpha Treasury')).not.toBeInTheDocument()
      expect(screen.getByTestId('safe-item')).toBeInTheDocument()
    })

    it('shows an empty state when nothing matches', async () => {
      renderWithSearch()
      await userEvent.type(screen.getByTestId('safe-dropdown-search-input'), 'nonexistent')

      expect(screen.getByTestId('dropdown-empty')).toHaveTextContent('No safes match your search')
      expect(screen.queryByTestId('safe-item')).not.toBeInTheDocument()
    })

    it('stops character keystrokes from bubbling to the popup (defeats base-ui typeahead) but lets Escape through', () => {
      const onKeyDownSpy = jest.fn()
      render(
        <div onKeyDown={onKeyDownSpy}>
          <SafeDropdownContainer items={[itemA, itemB]} onItemSelect={jest.fn()} closeDropdown={jest.fn()} />
        </div>,
      )
      const input = screen.getByTestId('safe-dropdown-search-input')

      fireEvent.keyDown(input, { key: 'a' })
      expect(onKeyDownSpy).not.toHaveBeenCalled()

      fireEvent.keyDown(input, { key: 'Escape' })
      expect(onKeyDownSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('scroll hint', () => {
    it('hides the hint when content does not overflow', () => {
      render(
        <SafeDropdownContainer
          items={[createItem()]}
          onItemSelect={jest.fn()}
          closeDropdown={jest.fn()}
          footer={<div>Footer</div>}
        />,
      )

      const scroller = screen.getByTestId('dropdown-scroll-area')
      setScrollMetrics(scroller, { scrollHeight: 200, clientHeight: 320, scrollTop: 0 })
      fireScroll(scroller)

      expect(screen.queryByTestId('scroll-hint')).not.toBeInTheDocument()
    })

    it('shows the hint when content overflows and the user has not scrolled to the bottom', () => {
      render(
        <SafeDropdownContainer
          items={[createItem()]}
          onItemSelect={jest.fn()}
          closeDropdown={jest.fn()}
          footer={<div>Footer</div>}
        />,
      )

      const scroller = screen.getByTestId('dropdown-scroll-area')
      setScrollMetrics(scroller, { scrollHeight: 1000, clientHeight: 320, scrollTop: 0 })
      fireScroll(scroller)

      expect(screen.getByTestId('scroll-hint')).toBeInTheDocument()
    })

    it('hides the hint once the user reaches the bottom', () => {
      render(
        <SafeDropdownContainer
          items={[createItem()]}
          onItemSelect={jest.fn()}
          closeDropdown={jest.fn()}
          footer={<div>Footer</div>}
        />,
      )

      const scroller = screen.getByTestId('dropdown-scroll-area')
      setScrollMetrics(scroller, { scrollHeight: 1000, clientHeight: 320, scrollTop: 0 })
      fireScroll(scroller)
      expect(screen.getByTestId('scroll-hint')).toBeInTheDocument()

      setScrollMetrics(scroller, { scrollHeight: 1000, clientHeight: 320, scrollTop: 680 })
      fireScroll(scroller)

      expect(screen.queryByTestId('scroll-hint')).not.toBeInTheDocument()
    })
  })
})
