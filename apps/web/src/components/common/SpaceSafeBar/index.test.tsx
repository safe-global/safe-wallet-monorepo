import { fireEvent, render } from '@testing-library/react'
import SpaceSafeBar from './index'

const mockItems = [
  {
    id: '1:0xSafe1',
    name: 'My Safe',
    address: '0xSafe1',
    threshold: 2,
    owners: 3,
    balance: '1000',
    chains: [{ chainId: '1', chainName: 'Ethereum', chainLogoUri: null, shortName: 'eth' }],
  },
]

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/home'),
}))

jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({ pathname: '/home' })),
}))

jest.mock('@/features/spaces', () => ({
  useIsQualifiedSafe: jest.fn(() => false),
  useCurrentSpaceId: () => undefined,
  matchesSafeSearch: jest.requireActual('@/features/spaces/components/SafeSelectorDropdown/utils').matchesSafeSearch,
  get SafeSelectorDropdown() {
    return jest.requireMock('@/features/spaces/components/SafeSelectorDropdown').default
  },
}))

jest.mock('@/hooks/useAllAddressBooks', () => ({
  useSafeNameResolver: () => (_address: string, _chainId: string | undefined, preferredName?: string) =>
    preferredName ?? '',
}))

jest.mock('@/components/address-book/EntryDialog', () => {
  const MockEntryDialog = (props: { defaultValues?: { name: string; address: string }; chainIds?: string[] }) => (
    <div
      data-testid="entry-dialog"
      data-name={props.defaultValues?.name}
      data-address={props.defaultValues?.address}
      data-chain-ids={JSON.stringify(props.chainIds)}
    />
  )
  MockEntryDialog.displayName = 'EntryDialog'
  return { __esModule: true, default: MockEntryDialog }
})

jest.mock('./hooks/useSpaceSafeSelectorItems', () => ({
  useSpaceSafeSelectorItems: jest.fn(),
}))

jest.mock('./hooks/useSpaceBackLink', () => ({
  useSpaceBackLink: jest.fn(),
}))

jest.mock('./SpaceChainSelector', () => {
  const MockSpaceChainSelector = () => <div data-testid="space-chain-selector" />
  MockSpaceChainSelector.displayName = 'SpaceChainSelector'
  return { __esModule: true, default: MockSpaceChainSelector }
})

jest.mock('@/features/spaces/components/SafeSelectorDropdown', () => {
  const MockSafeSelectorDropdown = (props: Record<string, unknown>) => {
    const footerFn = props.footer as ((close: () => void) => React.ReactNode) | undefined
    const emptyStateOverride = props.emptyStateOverride as React.ReactNode | ((close: () => void) => React.ReactNode)
    const onSearchValueChange = props.onSearchValueChange as ((value: string) => void) | undefined
    const onItemRename = props.onItemRename as
      | ((target: { address: string; name: string; chainIds: string[] }) => void)
      | undefined
    return (
      <div
        data-testid="safe-selector-dropdown"
        data-items={JSON.stringify(props.items)}
        data-error={String(props.isError)}
        data-selected-item-id={props.selectedItemId as string}
        data-has-on-item-select={String(typeof props.onItemSelect === 'function')}
        data-has-on-retry={String(typeof props.onRetry === 'function')}
        data-has-footer={String(typeof props.footer === 'function')}
      >
        {props.header as React.ReactNode}
        {emptyStateOverride != null && (
          <div data-testid="dropdown-empty-slot">
            {typeof emptyStateOverride === 'function' ? emptyStateOverride(() => {}) : emptyStateOverride}
          </div>
        )}
        {typeof footerFn === 'function' && <div data-testid="dropdown-footer-slot">{footerFn(() => {})}</div>}
        <input
          data-testid="mock-search-input"
          value={(props.searchValue as string) ?? ''}
          onChange={(e) => onSearchValueChange?.(e.target.value)}
        />
        <button
          type="button"
          data-testid="mock-rename-btn"
          onClick={() => onItemRename?.({ address: '0xSafe1', name: 'My Safe', chainIds: ['1'] })}
        />
      </div>
    )
  }
  MockSafeSelectorDropdown.displayName = 'SafeSelectorDropdown'
  return { __esModule: true, default: MockSafeSelectorDropdown }
})

jest.mock('./SpaceNestedSafesButton', () => {
  const MockSpaceNestedSafesButton = () => <div data-testid="nested-safes-button" />
  MockSpaceNestedSafesButton.displayName = 'SpaceNestedSafesButton'
  return { __esModule: true, default: MockSpaceNestedSafesButton }
})

jest.mock('@/features/myAccounts', () => ({
  MyAccountsFeature: {},
}))

jest.mock('@/features/__core__', () => ({
  useLoadFeature: () => ({}),
}))

jest.mock('@/components/common/TrustedSafesModal', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('@/components/common/TrustedSafesModal/useTrustedSafesModal', () => ({
  __esModule: true,
  default: () => ({ open: jest.fn(), close: jest.fn(), isOpen: false }),
}))

jest.mock('@/hooks/useSafeInfo', () => () => ({ safeAddress: '0xSafe1' }))

jest.mock('@/hooks/useSafeAddressFromUrl', () => ({
  useSafeAddressFromUrl: jest.fn(() => '0xSafe1'),
}))

jest.mock('@/hooks/useChainId', () => () => '1')

jest.mock('@/hooks/safes', () => ({
  ...jest.requireActual('@/hooks/safes'),
  useAllSafes: () => [],
}))

jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}))

jest.mock('@/components/common/ConnectWallet/useConnectWallet', () => {
  const connect = jest.fn()
  return { __esModule: true, default: () => connect }
})

jest.mock('@/store', () => ({
  useAppDispatch: () => jest.fn(),
  useAppSelector: () => ({}),
}))

import { usePathname } from 'next/navigation'
import { useRouter } from 'next/router'
import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import { useIsQualifiedSafe } from '@/features/spaces'
import { useSafeAddressFromUrl } from '@/hooks/useSafeAddressFromUrl'
import { useSpaceSafeSelectorItems } from './hooks/useSpaceSafeSelectorItems'
import { useSpaceBackLink } from './hooks/useSpaceBackLink'

const mockUsePathname = usePathname as jest.Mock
const mockUseRouter = useRouter as jest.Mock
const mockUseIsQualifiedSafe = useIsQualifiedSafe as jest.Mock
const mockUseSafeAddressFromUrl = useSafeAddressFromUrl as jest.Mock
const mockUseSpaceSafeSelectorItems = useSpaceSafeSelectorItems as jest.Mock
const mockUseSpaceBackLink = useSpaceBackLink as jest.Mock

describe('SpaceSafeBar', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockUsePathname.mockReturnValue('/home')
    mockUseRouter.mockReturnValue({ pathname: '/home' })
    mockUseSafeAddressFromUrl.mockReturnValue('0xSafe1')
    mockUseSpaceSafeSelectorItems.mockReturnValue({
      workspaceItems: [],
      localItems: mockItems,
      selectedItemId: '1:0xSafe1',
      handleItemSelect: jest.fn(),
      isError: false,
      refetch: jest.fn(),
      isInSpaceContext: false,
      hasWallet: true,
    })
    mockUseSpaceBackLink.mockReturnValue({
      space: undefined,
      handleBackToSpace: jest.fn(),
    })
  })

  it('always renders SafeSelectorDropdown', () => {
    const { getByTestId } = render(<SpaceSafeBar />)
    expect(getByTestId('safe-selector-dropdown')).toBeInTheDocument()
  })

  it('always renders SpaceChainSelector', () => {
    const { getByTestId } = render(<SpaceSafeBar />)
    expect(getByTestId('space-chain-selector')).toBeInTheDocument()
  })

  it('always renders SpaceNestedSafesButton', () => {
    const { getByTestId } = render(<SpaceSafeBar />)
    expect(getByTestId('nested-safes-button')).toBeInTheDocument()
  })

  it('passes the union of workspace + local items to SafeSelectorDropdown (for the trigger)', () => {
    const { getByTestId } = render(<SpaceSafeBar />)
    const dropdown = getByTestId('safe-selector-dropdown')
    expect(JSON.parse(dropdown.getAttribute('data-items')!)).toEqual(mockItems)
  })

  it('passes isError=true to SafeSelectorDropdown when the overview query fails', () => {
    mockUseSpaceSafeSelectorItems.mockReturnValue({
      workspaceItems: [],
      localItems: [],
      selectedItemId: '',
      handleItemSelect: jest.fn(),
      isError: true,
      refetch: jest.fn(),
      isInSpaceContext: false,
      hasWallet: true,
    })

    const { getByTestId } = render(<SpaceSafeBar />)
    expect(getByTestId('safe-selector-dropdown').getAttribute('data-error')).toBe('true')
  })

  it('passes selectedItemId, onItemSelect, and onRetry to SafeSelectorDropdown', () => {
    const { getByTestId } = render(<SpaceSafeBar />)
    const dropdown = getByTestId('safe-selector-dropdown')

    expect(dropdown.getAttribute('data-selected-item-id')).toBe('1:0xSafe1')
    expect(dropdown.getAttribute('data-has-on-item-select')).toBe('true')
    expect(dropdown.getAttribute('data-has-on-retry')).toBe('true')
  })

  it('renders the Manage list footer on the default Local tab', () => {
    // Off the Spaces level the default tab is Local, which carries the manage-trusted footer.
    const { getByTestId } = render(<SpaceSafeBar />)
    expect(getByTestId('safe-selector-dropdown').getAttribute('data-has-footer')).toBe('true')
    const manageBtn = getByTestId('dropdown-manage-trusted-btn')
    expect(manageBtn).toHaveTextContent('Manage list')
    expect(manageBtn).toHaveTextContent('Add or remove accounts from this list')
  })

  it('drops the footer and shows the No accounts empty state when connected with no trusted safes', () => {
    mockUseSpaceSafeSelectorItems.mockReturnValue({
      workspaceItems: [],
      localItems: [],
      selectedItemId: '',
      handleItemSelect: jest.fn(),
      isError: false,
      refetch: jest.fn(),
      isInSpaceContext: false,
      hasWallet: true,
    })

    const { getByTestId, queryByTestId } = render(<SpaceSafeBar />)
    expect(getByTestId('safe-selector-dropdown').getAttribute('data-has-footer')).toBe('false')
    expect(queryByTestId('dropdown-manage-trusted-btn')).not.toBeInTheDocument()
    const emptyState = getByTestId('dropdown-no-trusted')
    expect(emptyState).toHaveTextContent('No accounts yet')
    expect(emptyState).toHaveTextContent('Manage your list to add or remove accounts.')
    expect(getByTestId('dropdown-manage-list-btn')).toBeInTheDocument()
  })

  it('shows the Connect wallet empty state on the Local tab when no wallet is connected', () => {
    mockUseSpaceSafeSelectorItems.mockReturnValue({
      workspaceItems: [],
      localItems: [],
      selectedItemId: '',
      handleItemSelect: jest.fn(),
      isError: false,
      refetch: jest.fn(),
      isInSpaceContext: false,
      hasWallet: false,
    })

    const { getByTestId, queryByTestId } = render(<SpaceSafeBar />)
    expect(getByTestId('safe-selector-dropdown').getAttribute('data-has-footer')).toBe('false')
    const emptyState = getByTestId('dropdown-connect-cta')
    expect(emptyState).toHaveTextContent('Connect your wallet to access existing accounts or add new ones.')
    expect(getByTestId('dropdown-connect-wallet-body-btn')).toBeInTheDocument()
    expect(queryByTestId('dropdown-no-trusted')).not.toBeInTheDocument()
  })

  it('opens wallet onboarding from the Connect wallet empty state (dropdown closes first)', () => {
    mockUseSpaceSafeSelectorItems.mockReturnValue({
      workspaceItems: [],
      localItems: [],
      selectedItemId: '',
      handleItemSelect: jest.fn(),
      isError: false,
      refetch: jest.fn(),
      isInSpaceContext: false,
      hasWallet: false,
    })
    // The empty state is rendered via the function form of emptyStateOverride, so its button runs
    // close() before connect() — this is what keeps the wallet modal from opening behind the popup.
    const connect = useConnectWallet()

    const { getByTestId } = render(<SpaceSafeBar />)
    fireEvent.click(getByTestId('dropdown-connect-wallet-body-btn'))

    expect(connect).toHaveBeenCalledTimes(1)
  })

  it('does not render a footer on the Workspace tab (default in a space context)', () => {
    mockUseIsQualifiedSafe.mockReturnValue(true)
    mockUseSpaceSafeSelectorItems.mockReturnValue({
      workspaceItems: mockItems,
      localItems: [],
      selectedItemId: '1:0xSafe1',
      handleItemSelect: jest.fn(),
      isError: false,
      refetch: jest.fn(),
      isInSpaceContext: true,
      hasWallet: true,
    })
    mockUseSpaceBackLink.mockReturnValue({ space: { id: 1, name: 'Test Space' }, handleBackToSpace: jest.fn() })

    const { getByTestId } = render(<SpaceSafeBar />)
    expect(getByTestId('safe-selector-dropdown').getAttribute('data-has-footer')).toBe('false')
  })

  it('renders Workspace and Local tabs in the dropdown', () => {
    const { getByTestId } = render(<SpaceSafeBar />)
    expect(getByTestId('dropdown-tab-workspace')).toBeInTheDocument()
    expect(getByTestId('dropdown-tab-local')).toBeInTheDocument()
  })

  it('labels the Workspace tab "Workspace" off the Spaces level', () => {
    const { getByTestId } = render(<SpaceSafeBar />)
    expect(getByTestId('dropdown-tab-workspace').textContent).toBe('Workspace')
  })

  it('labels the Workspace tab with the space name in a space context', () => {
    mockUseIsQualifiedSafe.mockReturnValue(true)
    mockUseSpaceSafeSelectorItems.mockReturnValue({
      workspaceItems: mockItems,
      localItems: [],
      selectedItemId: '1:0xSafe1',
      handleItemSelect: jest.fn(),
      isError: false,
      refetch: jest.fn(),
      isInSpaceContext: true,
      hasWallet: true,
    })
    mockUseSpaceBackLink.mockReturnValue({ space: { id: 1, name: 'Test Space' }, handleBackToSpace: jest.fn() })

    const { getByTestId } = render(<SpaceSafeBar />)
    expect(getByTestId('dropdown-tab-workspace').textContent).toBe('Test Space (1)')
  })

  it('labels the Local tab with the my accounts count', () => {
    const { getByTestId } = render(<SpaceSafeBar />)
    expect(getByTestId('dropdown-tab-local').textContent).toBe('My accounts (1)')
  })

  it('updates the tab counts while searching across both lists', () => {
    mockUseSpaceSafeSelectorItems.mockReturnValue({
      workspaceItems: mockItems,
      localItems: [
        ...mockItems,
        {
          id: '1:0xSafe2',
          name: 'Other Safe',
          address: '0xSafe2',
          threshold: 1,
          owners: 1,
          balance: '0',
          chains: [{ chainId: '1', chainName: 'Ethereum', chainLogoUri: null, shortName: 'eth' }],
        },
      ],
      selectedItemId: '1:0xSafe1',
      handleItemSelect: jest.fn(),
      isError: false,
      refetch: jest.fn(),
      isInSpaceContext: true,
      hasWallet: true,
    })
    mockUseIsQualifiedSafe.mockReturnValue(true)
    mockUseSpaceBackLink.mockReturnValue({ space: { id: 1, name: 'Test Space' }, handleBackToSpace: jest.fn() })

    const { getByTestId } = render(<SpaceSafeBar />)
    expect(getByTestId('dropdown-tab-workspace').textContent).toBe('Test Space (1)')
    expect(getByTestId('dropdown-tab-local').textContent).toBe('My accounts (2)')

    fireEvent.change(getByTestId('mock-search-input'), { target: { value: 'Other' } })

    expect(getByTestId('dropdown-tab-workspace').textContent).toBe('Test Space (0)')
    expect(getByTestId('dropdown-tab-local').textContent).toBe('My accounts (1)')
  })

  it('opens the rename dialog with the safe details when a row rename is requested', () => {
    const { getByTestId, queryByTestId } = render(<SpaceSafeBar />)
    expect(queryByTestId('entry-dialog')).not.toBeInTheDocument()

    fireEvent.click(getByTestId('mock-rename-btn'))

    const dialog = getByTestId('entry-dialog')
    expect(dialog.getAttribute('data-name')).toBe('My Safe')
    expect(dialog.getAttribute('data-address')).toBe('0xSafe1')
    expect(dialog.getAttribute('data-chain-ids')).toBe('["1"]')
  })

  it.each([['/welcome/accounts'], ['/welcome/spaces'], ['/new-safe/create'], ['/new-safe/load']])(
    'renders nothing on hidden route %s',
    (pathname) => {
      mockUsePathname.mockReturnValue(pathname)
      mockUseRouter.mockReturnValue({ pathname })

      const { queryByTestId } = render(<SpaceSafeBar />)
      expect(queryByTestId('safe-selector-dropdown')).not.toBeInTheDocument()
      expect(queryByTestId('space-chain-selector')).not.toBeInTheDocument()
      expect(queryByTestId('nested-safes-button')).not.toBeInTheDocument()
    },
  )

  it.each([['/settings/notifications'], ['/settings/cookies'], ['/settings/appearance'], ['/settings']])(
    'renders nothing on settings route %s when URL has no safe',
    (pathname) => {
      mockUsePathname.mockReturnValue(pathname)
      mockUseSafeAddressFromUrl.mockReturnValue('')

      const { queryByTestId } = render(<SpaceSafeBar />)
      expect(queryByTestId('safe-selector-dropdown')).not.toBeInTheDocument()
      expect(queryByTestId('space-chain-selector')).not.toBeInTheDocument()
      expect(queryByTestId('nested-safes-button')).not.toBeInTheDocument()
    },
  )

  it.each([['/settings/setup'], ['/settings/security'], ['/settings/notifications']])(
    'renders normally on settings route %s when URL has a safe',
    (pathname) => {
      mockUsePathname.mockReturnValue(pathname)
      mockUseSafeAddressFromUrl.mockReturnValue('0xSafe1')

      const { getByTestId } = render(<SpaceSafeBar />)
      expect(getByTestId('safe-selector-dropdown')).toBeInTheDocument()
    },
  )

  it('still renders on non-settings routes when URL has no safe (Redux fallback path unchanged)', () => {
    mockUsePathname.mockReturnValue('/home')
    mockUseSafeAddressFromUrl.mockReturnValue('')

    const { getByTestId } = render(<SpaceSafeBar />)
    expect(getByTestId('safe-selector-dropdown')).toBeInTheDocument()
  })

  it.each([['/404'], ['/403'], ['/_offline']])('renders nothing on error route %s', (pathname) => {
    mockUsePathname.mockReturnValue(pathname)
    mockUseRouter.mockReturnValue({ pathname })

    const { queryByTestId } = render(<SpaceSafeBar />)
    expect(queryByTestId('safe-selector-dropdown')).not.toBeInTheDocument()
    expect(queryByTestId('space-chain-selector')).not.toBeInTheDocument()
    expect(queryByTestId('nested-safes-button')).not.toBeInTheDocument()
  })

  it.each([['/ho'], ['/some/unmatched/url']])(
    'renders nothing on unmatched URL %s where the matched route is /404',
    (browserPathname) => {
      mockUsePathname.mockReturnValue(browserPathname)
      mockUseRouter.mockReturnValue({ pathname: '/404' })

      const { queryByTestId } = render(<SpaceSafeBar />)
      expect(queryByTestId('safe-selector-dropdown')).not.toBeInTheDocument()
      expect(queryByTestId('space-chain-selector')).not.toBeInTheDocument()
      expect(queryByTestId('nested-safes-button')).not.toBeInTheDocument()
    },
  )

  it.each([['/terms'], ['/privacy'], ['/licenses'], ['/imprint'], ['/cookie']])(
    'renders nothing on static page %s',
    (pathname) => {
      mockUsePathname.mockReturnValue(pathname)
      mockUseRouter.mockReturnValue({ pathname })

      const { queryByTestId } = render(<SpaceSafeBar />)
      expect(queryByTestId('safe-selector-dropdown')).not.toBeInTheDocument()
      expect(queryByTestId('nested-safes-button')).not.toBeInTheDocument()
      expect(queryByTestId('space-chain-selector')).not.toBeInTheDocument()
    },
  )
})
