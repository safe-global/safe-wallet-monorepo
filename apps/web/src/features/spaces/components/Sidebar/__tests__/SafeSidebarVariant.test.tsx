import { render, screen, fireEvent } from '@testing-library/react'
import type { CSSProperties, ReactNode } from 'react'
import { getDeterministicColor } from '@/features/spaces'
import { SafeSidebarVariant } from '../variants/SafeSidebarVariant'
import type {
  SafeWorkspaceHeaderBackToSpace,
  SafeWorkspaceHeaderAddToWorkspace,
  ResolvedSidebarItem,
  ResolvedSidebarGroup,
} from '../types'
import { AppRoutes } from '@/config/routes'
import { ImplementationVersionState } from '@safe-global/store/gateway/types'

const mockRouterPush = jest.fn()
const mockUseSafeInfo = jest.fn()

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    query: {},
    pathname: '',
  }),
}))

jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: () => mockUseSafeInfo(),
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
  })

  it('renders space selector with name and back button when spaceId exists', () => {
    render(
      <SafeSidebarVariant
        workspaceHeader={createBackHeader({
          spaceName: 'My Safe Account',
          spaceInitial: 'M',
          spaceId: '123',
        })}
        mainNavItems={mockMainNavItems}
        defiGroup={mockDefiGroup}
      />,
    )

    expect(screen.getByText('My Safe Account')).toBeInTheDocument()
    expect(screen.getByText('Space')).toBeInTheDocument()
    expect(screen.getByText('M')).toBeInTheDocument()
    expect(screen.getByText('ChevronLeft')).toBeInTheDocument()
  })

  it('applies deterministic avatar color from space name like SpaceSelectorDropdown', () => {
    const spaceName = 'My Safe Account'

    render(
      <SafeSidebarVariant
        workspaceHeader={createBackHeader({ spaceName, spaceInitial: 'M', spaceId: '123' })}
        mainNavItems={mockMainNavItems}
        defiGroup={mockDefiGroup}
      />,
    )

    // Both the component and this import resolve to the same mock, so values match
    expect(screen.getByTestId('space-avatar-fallback')).toHaveStyle({
      backgroundColor: getDeterministicColor(spaceName),
    })
  })

  it('does not set avatar background when space name is empty', () => {
    render(
      <SafeSidebarVariant
        workspaceHeader={createBackHeader({ spaceName: '', spaceInitial: 'U', spaceId: '123' })}
        mainNavItems={mockMainNavItems}
        defiGroup={mockDefiGroup}
      />,
    )

    expect(screen.getByTestId('space-avatar-fallback').style.backgroundColor).toBe('')
  })

  it('derives initial from space name when spaceInitial not provided', () => {
    render(
      <SafeSidebarVariant
        workspaceHeader={createBackHeader({ spaceName: 'MySpace', spaceId: '123' })}
        mainNavItems={mockMainNavItems}
        defiGroup={mockDefiGroup}
      />,
    )

    expect(screen.getByText('M')).toBeInTheDocument()
  })

  it('uses provided spaceInitial when available', () => {
    render(
      <SafeSidebarVariant
        workspaceHeader={createBackHeader({ spaceName: 'MySpace', spaceInitial: 'X', spaceId: '123' })}
        mainNavItems={mockMainNavItems}
        defiGroup={mockDefiGroup}
      />,
    )

    expect(screen.getByText('X')).toBeInTheDocument()
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

  it('handles undefined space name', () => {
    render(
      <SafeSidebarVariant
        workspaceHeader={createBackHeader({ spaceName: '', spaceInitial: 'U', spaceId: '123' })}
        mainNavItems={mockMainNavItems}
        defiGroup={mockDefiGroup}
      />,
    )

    expect(screen.getByText('U')).toBeInTheDocument()
  })

  it('renders Add Safe to workspace when Safe is not in a Space', () => {
    render(
      <SafeSidebarVariant
        workspaceHeader={createAddHeader()}
        mainNavItems={mockMainNavItems}
        defiGroup={mockDefiGroup}
      />,
    )

    expect(screen.queryByText('ChevronLeft')).not.toBeInTheDocument()
    expect(screen.getByTestId('add-safe-to-workspace-button')).toBeInTheDocument()
    expect(screen.getByText('Add Safe to workspace')).toBeInTheDocument()
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

  it('navigates to the correct Space when back button is clicked', () => {
    render(
      <SafeSidebarVariant
        workspaceHeader={createBackHeader({
          spaceName: 'My Safe Account',
          spaceInitial: 'M',
          spaceId: '42',
        })}
        mainNavItems={mockMainNavItems}
        defiGroup={mockDefiGroup}
      />,
    )

    fireEvent.click(screen.getByTestId('back-to-space-button'))

    expect(mockRouterPush).toHaveBeenCalledWith({
      pathname: AppRoutes.spaces.index,
      query: { spaceId: '42' },
    })
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
