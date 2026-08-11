import { render, screen } from '@testing-library/react'
import { Home, FileText, Users, Shield } from 'lucide-react'
import type { ReactNode } from 'react'
import { SpacesSidebarVariant } from '../SpacesSidebarVariant'
import type { ResolvedSidebarNavItem, ResolvedSidebarGroup, SpaceItem } from '../../../types'

jest.mock('../../SidebarDeveloperGroup', () => ({
  SidebarDeveloperGroup: ({ isLoading }: { isLoading?: boolean }) => (
    <div data-testid="developer-group" data-loading={isLoading}>
      Developer group
    </div>
  ),
}))

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  TooltipContent: () => null,
}))

jest.mock('@/components/ui/sidebar', () => ({
  useSidebar: () => ({ state: 'expanded', isMobile: false }),
  SidebarContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarGroup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarGroupLabel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarSeparator: ({ className }: { className?: string }) => <hr className={className} />,
  SidebarGroupContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarMenuItem: ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  SidebarMenuButton: ({
    children,
    isActive,
    disabled,
    className,
    'data-testid': testId,
  }: {
    children: ReactNode
    isActive?: boolean
    disabled?: boolean
    className?: string
    'data-testid'?: string
  }) => (
    <button data-active={isActive} disabled={disabled} className={className} data-testid={testId}>
      {children}
    </button>
  ),
}))

jest.mock('next/link', () => {
  const Link = ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>
  Link.displayName = 'Link'
  return Link
})

jest.mock('../../SpaceSelectorDropdown', () => ({
  SpaceSelectorDropdown: ({ selectedSpace, spaces }: { selectedSpace?: SpaceItem; spaces?: SpaceItem[] }) => (
    <div>
      Selected: {selectedSpace?.name} | Spaces: {spaces?.length}
    </div>
  ),
}))

describe('SpacesSidebarVariant', () => {
  const mockSpace: SpaceItem = {
    uuid: 'uuid-1',
    name: 'Test Space',
    safeCount: 0,
  }

  const mockSpaces: SpaceItem[] = [
    { uuid: 'uuid-1', name: 'Space 1', safeCount: 0 },
    { uuid: 'uuid-2', name: 'Space 2', safeCount: 0 },
  ]

  const mockMainNavItems: ResolvedSidebarNavItem[] = [
    {
      icon: Home,
      label: 'Home',
      href: '/home',
      badge: 0,
      isActive: true,
      disabled: false,
      link: { pathname: '/home', query: { spaceId: '1' } },
    },
    {
      icon: FileText,
      label: 'Transactions',
      href: '/transactions',
      badge: 5,
      isActive: false,
      disabled: false,
      link: { pathname: '/transactions', query: { spaceId: '1' } },
    },
  ]

  const mockSetupGroup: ResolvedSidebarGroup = {
    label: 'Setup',
    items: [
      {
        icon: Users,
        label: 'Team',
        href: '/team',
        badge: 0,
        isActive: false,
        disabled: false,
        link: { pathname: '/team', query: { spaceId: '1' } },
      },
      {
        icon: Shield,
        label: 'Security',
        href: '/security',
        badge: 0,
        isActive: false,
        disabled: true,
        link: { pathname: '/security', query: { spaceId: '1' } },
      },
    ],
  }

  it('passes selectedSpace and spaces to the space selector dropdown', () => {
    render(
      <SpacesSidebarVariant
        mainNavItems={mockMainNavItems}
        setupGroup={mockSetupGroup}
        selectedSpace={mockSpace}
        spaces={mockSpaces}
      />,
    )

    expect(screen.getByText('Selected: Test Space | Spaces: 2')).toBeInTheDocument()
  })

  it('renders all navigation items with labels', () => {
    render(
      <SpacesSidebarVariant
        mainNavItems={mockMainNavItems}
        setupGroup={mockSetupGroup}
        selectedSpace={mockSpace}
        spaces={mockSpaces}
      />,
    )

    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByTestId('sidebar-item-transactions')).toBeInTheDocument()
    expect(screen.getByText('Setup')).toBeInTheDocument()
    expect(screen.getByText('Team')).toBeInTheDocument()
    expect(screen.getByText('Security')).toBeInTheDocument()
  })

  it('renders badge for items with non-zero badge count', () => {
    render(
      <SpacesSidebarVariant
        mainNavItems={mockMainNavItems}
        setupGroup={mockSetupGroup}
        selectedSpace={mockSpace}
        spaces={mockSpaces}
      />,
    )

    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByLabelText('5 Transactions notifications')).toBeInTheDocument()
  })

  it('disables items marked as disabled', () => {
    render(
      <SpacesSidebarVariant
        mainNavItems={mockMainNavItems}
        setupGroup={mockSetupGroup}
        selectedSpace={mockSpace}
        spaces={mockSpaces}
      />,
    )

    expect(screen.getByRole('button', { name: /Security/i })).toBeDisabled()
  })

  // The group is self-contained (it reads the config and owns the production guard), so its own tests
  // cover what it renders. Here we only pin down that this variant mounts it, last.
  describe('Developer group', () => {
    it('mounts the developer group after the Setup group', () => {
      const { container } = render(
        <SpacesSidebarVariant
          mainNavItems={mockMainNavItems}
          setupGroup={mockSetupGroup}
          selectedSpace={mockSpace}
          spaces={mockSpaces}
        />,
      )

      const marker = screen.getByTestId('developer-group')
      expect(marker).toBeInTheDocument()

      const text = container.textContent ?? ''
      expect(text.indexOf('Developer group')).toBeGreaterThan(text.indexOf('Setup'))
    })

    it('forwards the loading state to the group', () => {
      render(
        <SpacesSidebarVariant
          mainNavItems={mockMainNavItems}
          setupGroup={mockSetupGroup}
          selectedSpace={mockSpace}
          spaces={mockSpaces}
          isLoading
        />,
      )

      expect(screen.getByTestId('developer-group')).toHaveAttribute('data-loading', 'true')
    })
  })
})
