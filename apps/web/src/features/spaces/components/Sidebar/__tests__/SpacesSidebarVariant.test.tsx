import { render, screen } from '@testing-library/react'
import { Home, FileText, Users, Shield } from 'lucide-react'
import type { ReactNode } from 'react'
import { SpacesSidebarVariant } from '../variants/SpacesSidebarVariant'
import type { ResolvedSidebarItem, ResolvedSidebarGroup, SpaceItem } from '../types'

jest.mock('@/components/ui/sidebar', () => ({
  SidebarContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarGroup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarGroupLabel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarGroupContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarMenuItem: ({ children, className }: any) => <div className={className}>{children}</div>,
  SidebarMenuButton: ({ children, isActive, disabled, className, render: renderProp, ...props }: any) => (
    <button
      data-active={isActive}
      disabled={disabled}
      className={className}
      {...props}
      {...(renderProp ? { as: 'a' } : {})}
    >
      {children}
    </button>
  ),
}))

jest.mock('next/link', () => {
  const Link = ({ children, href }: any) => <a href={href}>{children}</a>
  Link.displayName = 'Link'
  return Link
})

jest.mock('../variants/SpaceSelectorDropdown', () => ({
  SpaceSelectorDropdown: ({ selectedSpace, spaces }: any) => (
    <div>
      Selected: {selectedSpace?.name} | Spaces: {spaces?.length}
    </div>
  ),
}))

describe('SpacesSidebarVariant', () => {
  const mockSpace: SpaceItem = {
    id: 1,
    name: 'Test Space',
  }

  const mockSpaces: SpaceItem[] = [
    { id: 1, name: 'Space 1' },
    { id: 2, name: 'Space 2' },
  ]

  const mockMainNavItems: ResolvedSidebarItem[] = [
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
})
