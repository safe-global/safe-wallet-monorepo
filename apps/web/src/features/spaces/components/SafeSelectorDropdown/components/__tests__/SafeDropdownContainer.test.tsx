import React, { act } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SafeDropdownContainer, { type SafeDropdownContainerProps } from '../SafeDropdownContainer'
import type { SafeItemData } from '../../types'

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

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
;(globalThis as unknown as { ResizeObserver: typeof ResizeObserverStub }).ResizeObserver = ResizeObserverStub

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

const baseProps: SafeDropdownContainerProps = {
  workspaceItems: [],
  localItems: [],
  hasWorkspace: true,
  isInSpaceContext: false, // default tab = Local
  onItemSelect: jest.fn(),
  onManageTrustedSafes: jest.fn(),
  onSignIn: jest.fn(),
  onAddSafe: jest.fn(),
  closeDropdown: jest.fn(),
}

const renderContainer = (props: Partial<SafeDropdownContainerProps> = {}) =>
  render(<SafeDropdownContainer {...baseProps} {...props} />)

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
    for (const key of Object.keys(mockAddressBookNames)) delete mockAddressBookNames[key]
  })

  describe('tabs', () => {
    it('renders both tabs', () => {
      renderContainer()
      expect(screen.getByTestId('dropdown-workspace-tab')).toBeInTheDocument()
      expect(screen.getByTestId('dropdown-local-tab')).toBeInTheDocument()
    })

    it('shows a Manage trusted Safes button on the Local tab', () => {
      const onManageTrustedSafes = jest.fn()
      const closeDropdown = jest.fn()
      renderContainer({ localItems: [createItem()], onManageTrustedSafes, closeDropdown })

      fireEvent.click(screen.getByTestId('dropdown-manage-trusted-btn'))
      expect(closeDropdown).toHaveBeenCalled()
      expect(onManageTrustedSafes).toHaveBeenCalled()
    })

    it('prompts to sign in on the Workspace tab when there is no workspace', () => {
      const onSignIn = jest.fn()
      renderContainer({ isInSpaceContext: true, hasWorkspace: false, onSignIn })

      expect(screen.getByTestId('dropdown-signin-prompt')).toBeInTheDocument()
      fireEvent.click(screen.getByTestId('dropdown-signin-btn'))
      expect(onSignIn).toHaveBeenCalled()
    })
  })

  describe('empty state', () => {
    it('shows "No trusted Safes yet" on the Local tab when there are none', () => {
      renderContainer({ localItems: [] })
      expect(screen.getByTestId('dropdown-empty')).toHaveTextContent('No trusted Safes yet')
    })

    it('shows "No safes in this workspace" on the Workspace tab when in a workspace with none', () => {
      renderContainer({ isInSpaceContext: true, hasWorkspace: true, workspaceItems: [] })
      expect(screen.getByTestId('dropdown-empty')).toHaveTextContent('No safes in this workspace')
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

    const renderWithSearch = () => renderContainer({ localItems: [itemA, itemB] })

    it('renders the search input when there are items', () => {
      renderWithSearch()
      expect(screen.getByTestId('safe-dropdown-search-input')).toBeInTheDocument()
    })

    it('hides the search input when the only safe is the currently-selected one', () => {
      renderContainer({ localItems: [createItem({ id: '1:0xaaaa', address: '0xaaaa' })], selectedItemId: '1:0xaaaa' })

      expect(screen.queryByTestId('safe-dropdown-search-input')).not.toBeInTheDocument()
      expect(screen.getByTestId('dropdown-empty')).toHaveTextContent('No trusted Safes yet')
    })

    it('does not render the search input on error', () => {
      renderContainer({ localItems: [itemA], isError: true, onRetry: jest.fn() })
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

    it('filters by the address-book name when the safe itself is unnamed', async () => {
      const unnamed = createItem({
        id: '1:0xcccccccccccccccccccccccccccccccccccccccc',
        name: '',
        address: '0xcccccccccccccccccccccccccccccccccccccccc',
        chains: [{ chainId: '1', chainName: 'Ethereum', chainLogoUri: null, shortName: 'eth' }],
      })
      mockAddressBookNames['0xcccccccccccccccccccccccccccccccccccccccc'] = 'Cold Storage'

      renderContainer({ localItems: [itemA, unnamed] })
      await userEvent.type(screen.getByTestId('safe-dropdown-search-input'), 'cold')

      expect(screen.queryByText('Alpha Treasury')).not.toBeInTheDocument()
      expect(screen.getByTestId('safe-item')).toBeInTheDocument()
    })

    it('shows an empty state when nothing matches', async () => {
      renderWithSearch()
      await userEvent.type(screen.getByTestId('safe-dropdown-search-input'), 'nonexistent')

      expect(screen.getByTestId('dropdown-empty')).toHaveTextContent('No safes match your search')
      expect(screen.queryByTestId('safe-item')).not.toBeInTheDocument()
    })

    it('stops character keystrokes from bubbling to the popup but lets Escape through', () => {
      const onKeyDownSpy = jest.fn()
      render(
        <div onKeyDown={onKeyDownSpy}>
          <SafeDropdownContainer {...baseProps} localItems={[itemA, itemB]} />
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
      renderContainer({ localItems: [createItem()] })

      const scroller = screen.getByTestId('dropdown-scroll-area')
      setScrollMetrics(scroller, { scrollHeight: 200, clientHeight: 320, scrollTop: 0 })
      fireScroll(scroller)

      expect(screen.queryByTestId('scroll-hint')).not.toBeInTheDocument()
    })

    it('shows the hint when content overflows and the user has not scrolled to the bottom', () => {
      renderContainer({ localItems: [createItem()] })

      const scroller = screen.getByTestId('dropdown-scroll-area')
      setScrollMetrics(scroller, { scrollHeight: 1000, clientHeight: 320, scrollTop: 0 })
      fireScroll(scroller)

      expect(screen.getByTestId('scroll-hint')).toBeInTheDocument()
    })

    it('hides the hint once the user reaches the bottom', () => {
      renderContainer({ localItems: [createItem()] })

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
