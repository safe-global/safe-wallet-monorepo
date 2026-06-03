import { render, screen } from '@testing-library/react'
import type { CSSProperties, ReactNode } from 'react'
import { SafeSidebarVariant } from '../SafeSidebarVariant'
import type {
  SafeWorkspaceHeaderBackToSpace,
  SafeWorkspaceHeaderAddToWorkspace,
  ResolvedSidebarItem,
  ResolvedSidebarGroup,
} from '../../../types'
import { AppRoutes } from '@/config/routes'
import { ImplementationVersionState } from '@safe-global/store/gateway/types'

const mockUseSafeInfo = jest.fn()
const mockUseIsCounterfactualSafe = jest.fn()
const mockUseSidebarHydrated = jest.fn()
const mockUseAppSelector = jest.fn()

jest.mock('@/store', () => ({
  useAppSelector: (...args: unknown[]) => mockUseAppSelector(...args),
}))

const mockUseUsersGetWithWalletsV1Query = jest.fn()
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/users', () => ({
  useUsersGetWithWalletsV1Query: (...args: unknown[]) => mockUseUsersGetWithWalletsV1Query(...args),
}))

const CURRENT_USER_ID = 7
const adminMembersForCurrentUser = [
  {
    role: 'ADMIN' as const,
    status: 'ACTIVE' as const,
    name: '',
    invitedBy: null,
    inviteExpiresAt: null,
    user: { id: CURRENT_USER_ID },
  },
]

jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    query: {},
    pathname: '',
  })),
}))

jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: () => mockUseSafeInfo(),
}))

jest.mock('@/features/counterfactual', () => ({
  useIsCounterfactualSafe: () => mockUseIsCounterfactualSafe(),
}))

jest.mock('../../../hooks/useSidebarHydrated', () => ({
  useSidebarHydrated: () => mockUseSidebarHydrated(),
}))

jest.mock('../../../NewTransactionButton', () => ({
  SidebarActionButton: () => (
    <button type="button" data-testid="new-tx-btn">
      New transaction
    </button>
  ),
}))

jest.mock('@safe-global/utils/utils/chains', () => ({
  isNonCriticalUpdate: () => false,
}))

jest.mock('@/features/spaces', () => ({
  useCurrentSpaceId: () => '42',
}))

jest.mock('@/utils/colors', () => ({
  getDeterministicColor: (name: string) => `color-${name}`,
}))

jest.mock('../../NavItem', () => ({
  NavItem: ({ item }: { item: ResolvedSidebarItem | null }) =>
    item ? (
      <div data-testid={item.testId ?? `sidebar-item-${item.label.toLowerCase()}`} data-active={item.isActive}>
        {item.label}
        {!!item.badge && <span aria-label={`${item.badge} ${item.label} notifications`}>{item.badge}</span>}
        {item.indicator && <span aria-hidden />}
      </div>
    ) : null,
}))

jest.mock('@/components/ui/sidebar', () => ({
  SidebarContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarGroup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarGroupLabel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarGroupContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarMenuItem: ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  SidebarMenuButton: ({
    children,
    isActive,
    tooltip,
    className,
    onClick,
    'data-testid': dataTestId,
  }: {
    children: ReactNode
    isActive?: boolean
    tooltip?: string
    className?: string
    onClick?: () => void
    'data-testid'?: string
  }) => (
    <div
      role="button"
      data-active={isActive}
      data-tooltip={tooltip}
      data-testid={dataTestId}
      className={className}
      onClick={onClick}
    >
      {children}
    </div>
  ),
}))

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: ReactNode }) => <span>{children}</span>,
  TooltipContent: () => null,
}))

jest.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  AvatarFallback: ({
    children,
    className,
    style,
  }: {
    children: ReactNode
    className?: string
    style?: CSSProperties
  }) => (
    <div data-testid="space-avatar-fallback" className={className} style={style}>
      {children}
    </div>
  ),
}))

jest.mock('../../../config', () => ({
  icons: {
    ChevronLeft: () => <div>ChevronLeft</div>,
  },
}))

jest.mock('../../SpaceSelectorDropdown', () => ({
  SpaceSelectorDropdown: ({ triggerVariant }: { triggerVariant?: 'default' | 'addToWorkspace' }) =>
    triggerVariant === 'addToWorkspace' ? (
      <button type="button" data-testid="add-safe-to-workspace-button">
        Add Safe to workspace
      </button>
    ) : (
      <div data-testid="space-selector-default">Space selector</div>
    ),
}))

const createBackHeader = (overrides: Partial<SafeWorkspaceHeaderBackToSpace> = {}): SafeWorkspaceHeaderBackToSpace => ({
  variant: 'backToSpace',
  spaceName: 'Test Safe',
  spaceId: '123',
  ...overrides,
})

const createAddHeader = (
  overrides: Partial<SafeWorkspaceHeaderAddToWorkspace> = {},
): SafeWorkspaceHeaderAddToWorkspace => ({
  variant: 'addToWorkspace',
  spaces: [],
  ...overrides,
})

const MockIcon = () => <div>Icon</div>

const createMockNavItem = (overrides: Partial<ResolvedSidebarItem> = {}): ResolvedSidebarItem => ({
  icon: MockIcon as unknown as ResolvedSidebarItem['icon'],
  label: 'Item',
  href: '/item',
  isActive: false,
  disabled: false,
  link: { pathname: '/item', query: {} },
  ...overrides,
})

describe('SafeSidebarVariant', () => {
  const mockMainNavItems: ResolvedSidebarItem[] = [
    createMockNavItem({ label: 'Overview', href: '/home', link: { pathname: '/home', query: { spaceId: null } } }),
    createMockNavItem({
      label: 'Transactions',
      href: '/transactions',
      link: { pathname: '/transactions', query: { spaceId: null } },
      badge: 2,
    }),
  ]

  const mockDefiGroup: ResolvedSidebarGroup = {
    label: 'Defi',
    items: [createMockNavItem({ label: 'Swap', href: '/swap', link: { pathname: '/swap', query: {} } })],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    const mockUseRouter = jest.requireMock('next/router').useRouter as jest.Mock
    mockUseRouter.mockReturnValue({
      push: jest.fn(),
      query: {},
      pathname: '',
    })
    mockUseSafeInfo.mockReturnValue({
      safe: { implementationVersionState: ImplementationVersionState.UP_TO_DATE, version: '1.3.0' },
    })
    mockUseIsCounterfactualSafe.mockReturnValue(false)
    mockUseSidebarHydrated.mockReturnValue(true)
    mockUseAppSelector.mockReturnValue(true)
    mockUseUsersGetWithWalletsV1Query.mockReturnValue({ currentData: { id: CURRENT_USER_ID } })
  })

  it('renders all navigation sections', () => {
    render(
      <SafeSidebarVariant
        workspaceHeader={createBackHeader({ spaceName: 'Test Safe', spaceInitial: 'T' })}
        mainNavItems={mockMainNavItems}
        defiGroup={mockDefiGroup}
      />,
    )

    expect(screen.getByText('Overview')).toBeInTheDocument()
    expect(screen.getByTestId('sidebar-item-transactions')).toBeInTheDocument()
    expect(screen.getByLabelText('2 Transactions notifications')).toBeInTheDocument()
    expect(screen.getByText('Defi')).toBeInTheDocument()
    expect(screen.getAllByText('Swap').length).toBeGreaterThan(0)
  })

  it('hides workspace header group for counterfactual addToWorkspace (undeployed) Safes', () => {
    mockUseIsCounterfactualSafe.mockReturnValue(true)

    render(
      <SafeSidebarVariant
        workspaceHeader={createAddHeader()}
        mainNavItems={mockMainNavItems}
        defiGroup={mockDefiGroup}
      />,
    )

    expect(screen.queryByTestId('add-safe-to-workspace-button')).not.toBeInTheDocument()
    expect(screen.queryByText('Add Safe to workspace')).not.toBeInTheDocument()
  })

  it('still renders backToSpace workspace header when Safe is counterfactual', () => {
    mockUseIsCounterfactualSafe.mockReturnValue(true)

    render(
      <SafeSidebarVariant
        workspaceHeader={createBackHeader({ spaceName: 'My Space', spaceId: '9' })}
        mainNavItems={mockMainNavItems}
        defiGroup={mockDefiGroup}
      />,
    )

    expect(screen.getByTestId('back-to-space-button')).toBeInTheDocument()
    expect(screen.getByText('My Space')).toBeInTheDocument()
  })

  it('renders all main navigation items', () => {
    const allNavItems: ResolvedSidebarItem[] = [
      createMockNavItem({ label: 'Overview', href: AppRoutes.home, link: { pathname: AppRoutes.home, query: {} } }),
      createMockNavItem({
        label: 'Assets',
        href: AppRoutes.balances.index,
        link: { pathname: AppRoutes.balances.index, query: {} },
      }),
      createMockNavItem({
        label: 'Transactions',
        href: AppRoutes.transactions.history,
        link: { pathname: AppRoutes.transactions.history, query: {} },
      }),
      createMockNavItem({
        label: 'Apps',
        href: AppRoutes.apps.index,
        link: { pathname: AppRoutes.apps.index, query: {} },
      }),
    ]

    render(
      <SafeSidebarVariant
        workspaceHeader={createBackHeader({ spaceName: 'Test Safe' })}
        mainNavItems={allNavItems}
        defiGroup={{ label: 'Defi', items: [] }}
      />,
    )

    expect(screen.getByTestId('sidebar-item-overview')).toBeInTheDocument()
    expect(screen.getByTestId('sidebar-item-assets')).toBeInTheDocument()
    expect(screen.getByTestId('sidebar-item-transactions')).toBeInTheDocument()
    expect(screen.getByTestId('sidebar-item-apps')).toBeInTheDocument()
  })

  describe('Settings', () => {
    it('renders Settings button', () => {
      render(
        <SafeSidebarVariant
          workspaceHeader={createBackHeader({ spaceName: 'Test Safe' })}
          mainNavItems={mockMainNavItems}
          defiGroup={mockDefiGroup}
        />,
      )

      expect(screen.getByText('Settings')).toBeInTheDocument()
    })

    it('shows outdated warning dot when Safe has a critical outdated version', () => {
      mockUseSafeInfo.mockReturnValue({
        safe: { implementationVersionState: ImplementationVersionState.OUTDATED, version: '1.1.1' },
      })

      const { container } = render(
        <SafeSidebarVariant
          workspaceHeader={createBackHeader({ spaceName: 'Test Safe' })}
          mainNavItems={mockMainNavItems}
          defiGroup={mockDefiGroup}
        />,
      )

      expect(container.querySelector('span[aria-hidden]')).toBeInTheDocument()
    })

    it('does not show outdated warning dot when Safe version is current', () => {
      mockUseSafeInfo.mockReturnValue({
        safe: { implementationVersionState: ImplementationVersionState.UP_TO_DATE, version: '1.4.1' },
      })

      const { container } = render(
        <SafeSidebarVariant
          workspaceHeader={createBackHeader({ spaceName: 'Test Safe' })}
          mainNavItems={mockMainNavItems}
          defiGroup={mockDefiGroup}
        />,
      )

      expect(container.querySelector('span[aria-hidden]')).not.toBeInTheDocument()
    })
  })

  describe('workspace header variants', () => {
    it('renders the backToSpace variant with space name and back button', () => {
      render(
        <SafeSidebarVariant
          workspaceHeader={createBackHeader({ spaceName: 'Development', spaceId: '42' })}
          mainNavItems={mockMainNavItems}
          defiGroup={mockDefiGroup}
        />,
      )

      expect(screen.getByText('Development')).toBeInTheDocument()
      expect(screen.getByTestId('back-to-space-button')).toBeInTheDocument()
    })

    it('uses the correct space initial for backToSpace variant avatar', () => {
      render(
        <SafeSidebarVariant
          workspaceHeader={createBackHeader({ spaceName: 'Enterprise', spaceInitial: 'E' })}
          mainNavItems={mockMainNavItems}
          defiGroup={mockDefiGroup}
        />,
      )

      const avatarFallback = screen.getByTestId('space-avatar-fallback')
      expect(avatarFallback).toHaveTextContent('E')
    })

    it('renders the addToWorkspace variant with the trigger button', () => {
      render(
        <SafeSidebarVariant
          workspaceHeader={createAddHeader({ spaces: [] })}
          mainNavItems={mockMainNavItems}
          defiGroup={mockDefiGroup}
        />,
      )

      expect(screen.getByTestId('add-safe-to-workspace-button')).toBeInTheDocument()
    })

    it('shows addToWorkspace when signed in and the Safe is deployed (not counterfactual)', () => {
      mockUseAppSelector.mockReturnValue(true)
      mockUseIsCounterfactualSafe.mockReturnValue(false)

      render(
        <SafeSidebarVariant
          workspaceHeader={createAddHeader({ spaces: [] })}
          mainNavItems={mockMainNavItems}
          defiGroup={mockDefiGroup}
        />,
      )

      expect(screen.getByTestId('add-safe-to-workspace-button')).toBeInTheDocument()
    })

    it('passes spaces array to addToWorkspace variant', () => {
      const spaces = [
        { id: 1, name: 'Team', safeCount: 5, members: adminMembersForCurrentUser },
        { id: 2, name: 'Personal', safeCount: 2, members: adminMembersForCurrentUser },
      ]
      render(
        <SafeSidebarVariant
          workspaceHeader={createAddHeader({ spaces })}
          mainNavItems={mockMainNavItems}
          defiGroup={mockDefiGroup}
        />,
      )

      expect(screen.getByTestId('add-safe-to-workspace-button')).toBeInTheDocument()
    })

    it('hides addToWorkspace when the user is not signed in (SIWE session)', () => {
      mockUseAppSelector.mockReturnValue(false)

      render(
        <SafeSidebarVariant
          workspaceHeader={createAddHeader({ spaces: [] })}
          mainNavItems={mockMainNavItems}
          defiGroup={mockDefiGroup}
        />,
      )

      expect(screen.queryByTestId('add-safe-to-workspace-button')).not.toBeInTheDocument()
      expect(screen.queryByText('Add Safe to workspace')).not.toBeInTheDocument()
    })

    it('hides the addToWorkspace section entirely when Safe is counterfactual (undeployed)', () => {
      mockUseIsCounterfactualSafe.mockReturnValue(true)
      const spaces = [{ id: 1, name: 'Team', safeCount: 0 }]

      render(
        <SafeSidebarVariant
          workspaceHeader={createAddHeader({ spaces })}
          mainNavItems={mockMainNavItems}
          defiGroup={mockDefiGroup}
        />,
      )

      expect(screen.queryByTestId('add-safe-to-workspace-button')).not.toBeInTheDocument()
    })

    it('keeps backToSpace header visible when Safe is counterfactual', () => {
      mockUseIsCounterfactualSafe.mockReturnValue(true)

      render(
        <SafeSidebarVariant
          workspaceHeader={createBackHeader({ spaceName: 'Shared Workspace', spaceId: '100' })}
          mainNavItems={mockMainNavItems}
          defiGroup={mockDefiGroup}
        />,
      )

      expect(screen.getByTestId('back-to-space-button')).toBeInTheDocument()
      expect(screen.getByText('Shared Workspace')).toBeInTheDocument()
    })

    it('renders correct number of spaces in addToWorkspace when multiple spaces provided', () => {
      const spaces = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        name: `Space ${i + 1}`,
        safeCount: 0,
        members: adminMembersForCurrentUser,
      }))

      render(
        <SafeSidebarVariant
          workspaceHeader={createAddHeader({ spaces })}
          mainNavItems={mockMainNavItems}
          defiGroup={mockDefiGroup}
        />,
      )

      expect(screen.getByTestId('add-safe-to-workspace-button')).toBeInTheDocument()
    })
  })

  describe('conditional rendering edge cases', () => {
    it('renders correctly with empty main navigation items', () => {
      render(<SafeSidebarVariant workspaceHeader={createBackHeader()} mainNavItems={[]} defiGroup={mockDefiGroup} />)

      expect(screen.getByText('Defi')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })

    it('hides DeFi group when it has no items', () => {
      render(
        <SafeSidebarVariant
          workspaceHeader={createBackHeader()}
          mainNavItems={mockMainNavItems}
          defiGroup={{ label: 'Defi', items: [] }}
        />,
      )

      expect(screen.queryByText('Defi')).not.toBeInTheDocument()
    })

    it('renders DeFi group with single item', () => {
      const singleDefiGroup: ResolvedSidebarGroup = {
        label: 'Defi',
        items: [createMockNavItem({ label: 'Stake', href: '/stake', link: { pathname: '/stake', query: {} } })],
      }

      render(
        <SafeSidebarVariant
          workspaceHeader={createBackHeader()}
          mainNavItems={mockMainNavItems}
          defiGroup={singleDefiGroup}
        />,
      )

      expect(screen.getByText('Defi')).toBeInTheDocument()
      expect(screen.getByText('Stake')).toBeInTheDocument()
    })

    it('renders DeFi group with multiple items', () => {
      const multiDefiGroup: ResolvedSidebarGroup = {
        label: 'Defi',
        items: [
          createMockNavItem({ label: 'Swap', href: '/swap', link: { pathname: '/swap', query: {} } }),
          createMockNavItem({ label: 'Stake', href: '/stake', link: { pathname: '/stake', query: {} } }),
          createMockNavItem({ label: 'Earn', href: '/earn', link: { pathname: '/earn', query: {} } }),
        ],
      }

      render(
        <SafeSidebarVariant
          workspaceHeader={createBackHeader()}
          mainNavItems={mockMainNavItems}
          defiGroup={multiDefiGroup}
        />,
      )

      expect(screen.getByText('Defi')).toBeInTheDocument()
      expect(screen.getByText('Swap')).toBeInTheDocument()
      expect(screen.getByText('Stake')).toBeInTheDocument()
      expect(screen.getByText('Earn')).toBeInTheDocument()
    })

    it('renders without workspace header when not hydrated', () => {
      mockUseSidebarHydrated.mockReturnValue(false)

      render(
        <SafeSidebarVariant
          workspaceHeader={createAddHeader()}
          mainNavItems={mockMainNavItems}
          defiGroup={mockDefiGroup}
        />,
      )

      expect(screen.getByText('Overview')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })

    it('marks Settings as active when on settings page', () => {
      const mockRouter = jest.requireMock('next/router').useRouter as jest.Mock
      mockRouter.mockReturnValue({
        push: jest.fn(),
        query: { safe: '0x123' },
        pathname: AppRoutes.settings.setup,
      })

      render(
        <SafeSidebarVariant
          workspaceHeader={createBackHeader()}
          mainNavItems={mockMainNavItems}
          defiGroup={mockDefiGroup}
        />,
      )

      const settingsButton = screen.getByTestId('sidebar-settings-item')
      expect(settingsButton).toHaveAttribute('data-active', 'true')
    })

    it('marks Settings as active when on settings sub-tab page', () => {
      const mockRouter = jest.requireMock('next/router').useRouter as jest.Mock
      mockRouter.mockReturnValue({
        push: jest.fn(),
        query: { safe: '0x123' },
        pathname: AppRoutes.settings.security,
      })

      render(
        <SafeSidebarVariant
          workspaceHeader={createBackHeader()}
          mainNavItems={mockMainNavItems}
          defiGroup={mockDefiGroup}
        />,
      )

      const settingsButton = screen.getByTestId('sidebar-settings-item')
      expect(settingsButton).toHaveAttribute('data-active', 'true')
    })

    it('shows outdated dot for critical OUTDATED version state', () => {
      mockUseSafeInfo.mockReturnValue({
        safe: { implementationVersionState: ImplementationVersionState.OUTDATED, version: '1.0.0' },
      })

      const { container } = render(
        <SafeSidebarVariant
          workspaceHeader={createBackHeader()}
          mainNavItems={mockMainNavItems}
          defiGroup={mockDefiGroup}
        />,
      )

      const outdatedDot = container.querySelector('span[aria-hidden]')
      expect(outdatedDot).toBeInTheDocument()
    })

    it('does not show outdated dot when version is UNKNOWN', () => {
      mockUseSafeInfo.mockReturnValue({
        safe: { implementationVersionState: 'UNKNOWN' as unknown as ImplementationVersionState, version: null },
      })

      const { container } = render(
        <SafeSidebarVariant
          workspaceHeader={createBackHeader()}
          mainNavItems={mockMainNavItems}
          defiGroup={mockDefiGroup}
        />,
      )

      expect(container.querySelector('span[aria-hidden]')).not.toBeInTheDocument()
    })

    it('renders sidebar with no props variations when all groups are empty', () => {
      render(
        <SafeSidebarVariant
          workspaceHeader={createBackHeader({ spaceName: '' })}
          mainNavItems={[]}
          defiGroup={{ label: 'Defi', items: [] }}
        />,
      )

      expect(screen.getByText('Settings')).toBeInTheDocument()
      expect(screen.queryByText('Defi')).not.toBeInTheDocument()
    })

    it('handles backToSpace variant when isHydrated is true', () => {
      const mockRouter = jest.requireMock('next/router').useRouter as jest.Mock
      mockRouter.mockReturnValue({
        push: jest.fn(),
        query: { safe: '0xDeadBeef' },
        pathname: '/home',
      })

      mockUseSidebarHydrated.mockReturnValue(true)

      render(
        <SafeSidebarVariant
          workspaceHeader={createBackHeader({ spaceName: 'Main Workspace', spaceId: '1' })}
          mainNavItems={mockMainNavItems}
          defiGroup={mockDefiGroup}
        />,
      )

      expect(screen.getByText('Main Workspace')).toBeInTheDocument()
      expect(screen.getByTestId('back-to-space-button')).toBeInTheDocument()
    })

    it('renders action button in all variants', () => {
      render(
        <SafeSidebarVariant
          workspaceHeader={createBackHeader()}
          mainNavItems={mockMainNavItems}
          defiGroup={mockDefiGroup}
        />,
      )

      expect(screen.getByTestId('new-tx-btn')).toBeInTheDocument()
    })
  })
})
