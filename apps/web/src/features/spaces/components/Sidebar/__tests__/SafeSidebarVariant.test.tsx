import { render, screen } from '@testing-library/react'
import type { CSSProperties, ReactNode } from 'react'
import { SafeSidebarVariant } from '../variants/SafeSidebarVariant'
import type {
  SafeWorkspaceHeaderBackToSpace,
  SafeWorkspaceHeaderAddToWorkspace,
  ResolvedSidebarItem,
  ResolvedSidebarGroup,
} from '../types'
import { AppRoutes } from '@/config/routes'
import { ImplementationVersionState } from '@safe-global/store/gateway/types'

const mockUseSafeInfo = jest.fn()
const mockUseIsCounterfactualSafe = jest.fn()

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    query: {},
    pathname: '',
  }),
}))

jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: () => mockUseSafeInfo(),
}))

jest.mock('@/features/counterfactual', () => ({
  useIsCounterfactualSafe: () => mockUseIsCounterfactualSafe(),
}))

jest.mock('../NewTransactionButton', () => ({
  NewTransactionButton: () => (
    <button type="button" data-testid="new-tx-btn">
      New transaction
    </button>
  ),
}))

jest.mock('@safe-global/utils/utils/chains', () => ({
  isNonCriticalUpdate: () => false,
}))

jest.mock('@/features/spaces', () => ({
  getDeterministicColor: (name: string) => `color-${name}`,
}))

jest.mock('../variants/NavItem', () => ({
  NavItem: ({ item }: { item: ResolvedSidebarItem }) => (
    <div data-testid={`sidebar-item-${item.label.toLowerCase()}`}>
      {item.label}
      {item.badge !== undefined && item.badge > 0 && (
        <span aria-label={`${item.badge} ${item.label} notifications`}>{item.badge}</span>
      )}
    </div>
  ),
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
    <button
      data-active={isActive}
      data-tooltip={tooltip}
      data-testid={dataTestId}
      className={className}
      onClick={onClick}
    >
      {children}
    </button>
  ),
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

jest.mock('../config', () => ({
  icons: {
    ChevronLeft: () => <div>ChevronLeft</div>,
  },
}))

jest.mock('../variants/SpaceSelectorDropdown', () => ({
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

describe('SafeSidebarVariant', () => {
  const MockIcon = () => <div>Icon</div>

  const mockMainNavItems: ResolvedSidebarItem[] = [
    {
      icon: MockIcon as unknown as ResolvedSidebarItem['icon'],
      label: 'Overview',
      href: '/home',
      isActive: false,
      disabled: false,
      link: { pathname: '/home', query: { spaceId: null } },
    },
    {
      icon: MockIcon as unknown as ResolvedSidebarItem['icon'],
      label: 'Transactions',
      href: '/transactions',
      isActive: false,
      disabled: false,
      link: { pathname: '/transactions', query: { spaceId: null } },
      badge: 2,
    },
  ]

  const mockDefiGroup: ResolvedSidebarGroup = {
    label: 'Defi',
    items: [
      {
        icon: MockIcon as unknown as ResolvedSidebarItem['icon'],
        label: 'Swap',
        href: '/swap',
        isActive: false,
        disabled: false,
        link: { pathname: '/swap', query: { spaceId: null } },
      },
    ],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSafeInfo.mockReturnValue({
      safe: { implementationVersionState: ImplementationVersionState.UP_TO_DATE, version: '1.3.0' },
    })
    mockUseIsCounterfactualSafe.mockReturnValue(false)
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
    const MockIcon = () => <div>Icon</div>
    const allNavItems: ResolvedSidebarItem[] = [
      {
        icon: MockIcon as unknown as ResolvedSidebarItem['icon'],
        label: 'Overview',
        href: AppRoutes.home,
        isActive: false,
        disabled: false,
        link: { pathname: AppRoutes.home, query: {} },
      },
      {
        icon: MockIcon as unknown as ResolvedSidebarItem['icon'],
        label: 'Assets',
        href: AppRoutes.balances.index,
        isActive: false,
        disabled: false,
        link: { pathname: AppRoutes.balances.index, query: {} },
      },
      {
        icon: MockIcon as unknown as ResolvedSidebarItem['icon'],
        label: 'Transactions',
        href: AppRoutes.transactions.history,
        isActive: false,
        disabled: false,
        link: { pathname: AppRoutes.transactions.history, query: {} },
      },
      {
        icon: MockIcon as unknown as ResolvedSidebarItem['icon'],
        label: 'Apps',
        href: AppRoutes.apps.index,
        isActive: false,
        disabled: false,
        link: { pathname: AppRoutes.apps.index, query: {} },
      },
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
})
