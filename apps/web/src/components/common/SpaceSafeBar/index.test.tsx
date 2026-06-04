import { render } from '@testing-library/react'
import SpaceSafeBar from './index'
import { TxModalContext } from '@/components/tx-flow'

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

jest.mock('@/features/spaces', () => ({
  useIsQualifiedSafe: jest.fn(() => false),
}))

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
        {typeof footerFn === 'function' && <div data-testid="dropdown-footer-slot">{footerFn(() => {})}</div>}
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

jest.mock('./AccountsModal', () => {
  const MockAccountsModal = () => <div data-testid="accounts-modal" />
  MockAccountsModal.displayName = 'AccountsModal'
  return { __esModule: true, default: MockAccountsModal }
})

jest.mock('@/features/myAccounts', () => ({
  MyAccountsFeature: {},
  useSafeSelectionModal: () => ({ open: jest.fn(), close: jest.fn(), isOpen: false }),
}))

jest.mock('@/features/__core__', () => ({
  useLoadFeature: () => ({
    SafeSelectionModal: () => null,
  }),
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

jest.mock('@/components/common/ConnectWallet/useConnectWallet', () => () => jest.fn())

jest.mock('@/store', () => ({
  useAppDispatch: () => jest.fn(),
  useAppSelector: () => ({}),
}))

jest.mock('./SpaceBackLink', () => {
  const MockSpaceBackLink = (props: Record<string, unknown>) => (
    <div
      data-testid="space-back-link"
      data-space-name={(props.space as { name: string })?.name}
      data-has-on-click={String(typeof props.onClick === 'function')}
    />
  )
  MockSpaceBackLink.displayName = 'SpaceBackLink'
  return { __esModule: true, default: MockSpaceBackLink }
})

import { usePathname } from 'next/navigation'
import { useIsQualifiedSafe } from '@/features/spaces'
import { useSafeAddressFromUrl } from '@/hooks/useSafeAddressFromUrl'
import useWallet from '@/hooks/wallets/useWallet'
import { useSpaceSafeSelectorItems } from './hooks/useSpaceSafeSelectorItems'
import { useSpaceBackLink } from './hooks/useSpaceBackLink'

const mockUsePathname = usePathname as jest.Mock
const mockUseIsQualifiedSafe = useIsQualifiedSafe as jest.Mock
const mockUseSafeAddressFromUrl = useSafeAddressFromUrl as jest.Mock
const mockUseSpaceSafeSelectorItems = useSpaceSafeSelectorItems as jest.Mock
const mockUseSpaceBackLink = useSpaceBackLink as jest.Mock
const mockUseWallet = useWallet as jest.Mock

describe('SpaceSafeBar', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockUsePathname.mockReturnValue('/home')
    mockUseSafeAddressFromUrl.mockReturnValue('0xSafe1')
    mockUseSpaceSafeSelectorItems.mockReturnValue({
      items: mockItems,
      selectedItemId: '1:0xSafe1',
      handleItemSelect: jest.fn(),
      isError: false,
      refetch: jest.fn(),
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

  it('passes items from the hook to SafeSelectorDropdown', () => {
    const { getByTestId } = render(<SpaceSafeBar />)
    const dropdown = getByTestId('safe-selector-dropdown')
    expect(JSON.parse(dropdown.getAttribute('data-items')!)).toEqual(mockItems)
  })

  it('passes isError=true to SafeSelectorDropdown when the overview query fails', () => {
    mockUseSpaceSafeSelectorItems.mockReturnValue({
      items: [],
      selectedItemId: '',
      handleItemSelect: jest.fn(),
      isError: true,
      refetch: jest.fn(),
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

  it('passes an All Accounts footer to SafeSelectorDropdown on the Spaces level (WA-2462)', () => {
    mockUseIsQualifiedSafe.mockReturnValue(true)
    mockUseSpaceBackLink.mockReturnValue({
      space: { id: 1, name: 'Test Space' },
      handleBackToSpace: jest.fn(),
    })

    const { getByTestId } = render(<SpaceSafeBar />)
    expect(getByTestId('safe-selector-dropdown').getAttribute('data-has-footer')).toBe('true')
  })

  it('passes a footer to SafeSelectorDropdown when not on the Spaces level', () => {
    mockUseIsQualifiedSafe.mockReturnValue(false)

    const { getByTestId } = render(<SpaceSafeBar />)
    expect(getByTestId('safe-selector-dropdown').getAttribute('data-has-footer')).toBe('true')
  })

  it('labels the dropdown footer "All Accounts" when not on the Spaces level (wallet connected)', () => {
    mockUseIsQualifiedSafe.mockReturnValue(false)
    mockUseWallet.mockReturnValue({ address: '0xWalletOwner' })

    const { getByTestId } = render(<SpaceSafeBar />)
    expect(getByTestId('all-accounts-btn').textContent).toContain('All Accounts')
  })

  it('labels the dropdown footer "Explore other Safes" on the Spaces level', () => {
    mockUseIsQualifiedSafe.mockReturnValue(true)
    mockUseSpaceBackLink.mockReturnValue({
      space: { id: 1, name: 'Test Space' },
      handleBackToSpace: jest.fn(),
    })

    const { getByTestId } = render(<SpaceSafeBar />)
    expect(getByTestId('all-accounts-btn').textContent).toContain('Explore other Safes')
  })

  it('renders the "Safes in this workspace" dropdown header on the Spaces level', () => {
    mockUseIsQualifiedSafe.mockReturnValue(true)
    mockUseSpaceBackLink.mockReturnValue({
      space: { id: 1, name: 'Test Space' },
      handleBackToSpace: jest.fn(),
    })

    const { getByTestId } = render(<SpaceSafeBar />)
    expect(getByTestId('workspace-header').textContent).toBe('Safes in this workspace')
  })

  it('does not render the workspace header off the Spaces level', () => {
    mockUseIsQualifiedSafe.mockReturnValue(false)

    const { queryByTestId } = render(<SpaceSafeBar />)
    expect(queryByTestId('workspace-header')).not.toBeInTheDocument()
  })

  it('renders SpaceBackLink when in space context and space data is available', () => {
    mockUseIsQualifiedSafe.mockReturnValue(true)
    mockUseSpaceBackLink.mockReturnValue({
      space: { id: 42, name: 'Acme Corp' },
      handleBackToSpace: jest.fn(),
    })

    const { getByTestId } = render(<SpaceSafeBar />)
    const backLink = getByTestId('space-back-link')
    expect(backLink).toBeInTheDocument()
    expect(backLink.getAttribute('data-space-name')).toBe('Acme Corp')
    expect(backLink.getAttribute('data-has-on-click')).toBe('true')
  })

  it('does not render SpaceBackLink when not in space context', () => {
    mockUseIsQualifiedSafe.mockReturnValue(false)
    mockUseSpaceBackLink.mockReturnValue({
      space: { id: 42, name: 'Acme Corp' },
      handleBackToSpace: jest.fn(),
    })

    const { queryByTestId } = render(<SpaceSafeBar />)
    expect(queryByTestId('space-back-link')).not.toBeInTheDocument()
  })

  it('does not render SpaceBackLink when space data is undefined', () => {
    mockUseIsQualifiedSafe.mockReturnValue(true)
    mockUseSpaceBackLink.mockReturnValue({
      space: undefined,
      handleBackToSpace: jest.fn(),
    })

    const { queryByTestId } = render(<SpaceSafeBar />)
    expect(queryByTestId('space-back-link')).not.toBeInTheDocument()
  })

  it('renders both SpaceBackLink and SafeSelectorDropdown together', () => {
    mockUseIsQualifiedSafe.mockReturnValue(true)
    mockUseSpaceBackLink.mockReturnValue({
      space: { id: 1, name: 'Test Space' },
      handleBackToSpace: jest.fn(),
    })

    const { getByTestId } = render(<SpaceSafeBar />)
    expect(getByTestId('space-back-link')).toBeInTheDocument()
    expect(getByTestId('safe-selector-dropdown')).toBeInTheDocument()
  })

  it('hides SpaceBackLink while a tx-flow modal is open', () => {
    mockUseIsQualifiedSafe.mockReturnValue(true)
    mockUseSpaceBackLink.mockReturnValue({
      space: { id: 1, name: 'Test Space' },
      handleBackToSpace: jest.fn(),
    })

    const { queryByTestId, getByTestId } = render(
      <TxModalContext.Provider value={{ txFlow: <div />, setTxFlow: jest.fn(), setFullWidth: jest.fn() }}>
        <SpaceSafeBar />
      </TxModalContext.Provider>,
    )

    expect(queryByTestId('space-back-link')).not.toBeInTheDocument()
    // Other elements still render — only the back link is hidden
    expect(getByTestId('safe-selector-dropdown')).toBeInTheDocument()
    expect(getByTestId('space-chain-selector')).toBeInTheDocument()
  })

  it.each([['/welcome/accounts'], ['/welcome/spaces'], ['/new-safe/create'], ['/new-safe/load']])(
    'renders nothing on hidden route %s',
    (pathname) => {
      mockUsePathname.mockReturnValue(pathname)

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

  it.each([['/terms'], ['/privacy'], ['/licenses'], ['/imprint'], ['/cookie']])(
    'renders nothing on static page %s',
    (pathname) => {
      mockUsePathname.mockReturnValue(pathname)

      const { queryByTestId } = render(<SpaceSafeBar />)
      expect(queryByTestId('safe-selector-dropdown')).not.toBeInTheDocument()
      expect(queryByTestId('nested-safes-button')).not.toBeInTheDocument()
      expect(queryByTestId('space-chain-selector')).not.toBeInTheDocument()
    },
  )
})
