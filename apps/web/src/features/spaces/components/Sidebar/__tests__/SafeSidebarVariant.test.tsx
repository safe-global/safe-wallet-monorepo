import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { SafeSidebarVariant } from '../variants/SafeSidebarVariant'
import type { SpaceItem, ResolvedSidebarItem, ResolvedSidebarGroup } from '../types'

const mockUseCurrentSpaceId = jest.fn()

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    query: {},
  }),
}))

jest.mock('@/features/spaces/hooks/useCurrentSpaceId', () => ({
  useCurrentSpaceId: () => mockUseCurrentSpaceId(),
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
  }: {
    children: ReactNode
    isActive?: boolean
    tooltip?: string
    className?: string
  }) => (
    <button data-active={isActive} data-tooltip={tooltip} className={className}>
      {children}
    </button>
  ),
}))

jest.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  AvatarFallback: ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}))

jest.mock('../config', () => ({
  icons: {
    ChevronLeft: () => <div>ChevronLeft</div>,
  },
}))

describe('SafeSidebarVariant', () => {
  const mockSpace: SpaceItem = {
    id: 1,
    name: 'Test Safe',
  }

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
    mockUseCurrentSpaceId.mockReturnValue(null)
  })

  it('renders space selector with name and back button when spaceId exists', () => {
    mockUseCurrentSpaceId.mockReturnValue('123')

    render(
      <SafeSidebarVariant
        spaceName="My Safe Account"
        spaceInitial="M"
        selectedSpace={mockSpace}
        mainNavItems={mockMainNavItems}
        defiGroup={mockDefiGroup}
      />,
    )

    expect(screen.getByText('My Safe Account')).toBeInTheDocument()
    expect(screen.getByText('Space')).toBeInTheDocument()
    expect(screen.getByText('M')).toBeInTheDocument()
    expect(screen.getByText('ChevronLeft')).toBeInTheDocument()
  })

  it('derives initial from space name when spaceInitial not provided', () => {
    mockUseCurrentSpaceId.mockReturnValue('123')

    render(
      <SafeSidebarVariant
        spaceName="MySpace"
        selectedSpace={mockSpace}
        mainNavItems={mockMainNavItems}
        defiGroup={mockDefiGroup}
      />,
    )

    expect(screen.getByText('M')).toBeInTheDocument()
  })

  it('uses provided spaceInitial when available', () => {
    mockUseCurrentSpaceId.mockReturnValue('123')

    render(
      <SafeSidebarVariant
        spaceName="MySpace"
        spaceInitial="X"
        selectedSpace={mockSpace}
        mainNavItems={mockMainNavItems}
        defiGroup={mockDefiGroup}
      />,
    )

    expect(screen.getByText('X')).toBeInTheDocument()
  })

  it('renders all navigation sections', () => {
    render(
      <SafeSidebarVariant
        spaceName="Test Safe"
        spaceInitial="T"
        selectedSpace={mockSpace}
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
    mockUseCurrentSpaceId.mockReturnValue('123')

    render(
      <SafeSidebarVariant
        spaceInitial="U"
        selectedSpace={mockSpace}
        mainNavItems={mockMainNavItems}
        defiGroup={mockDefiGroup}
      />,
    )

    expect(screen.getByText('U')).toBeInTheDocument()
  })

  it('does not render back to space button when no spaceId', () => {
    render(
      <SafeSidebarVariant
        spaceName="My Safe Account"
        spaceInitial="M"
        selectedSpace={mockSpace}
        mainNavItems={mockMainNavItems}
        defiGroup={mockDefiGroup}
      />,
    )

    expect(screen.queryByText('ChevronLeft')).not.toBeInTheDocument()
  })
})
