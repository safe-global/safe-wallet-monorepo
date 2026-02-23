import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { SafeSidebarVariant } from '../variants/SafeSidebarVariant'
import type { SpaceItem } from '../types'

// Mock sidebar UI components
jest.mock('@/components/ui/sidebar', () => ({
  SidebarContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarGroup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarGroupLabel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarGroupContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarMenuItem: ({ children, className }: any) => <div className={className}>{children}</div>,
  SidebarMenuButton: ({ children, isActive, tooltip, className }: any) => (
    <button data-active={isActive} data-tooltip={tooltip} className={className}>
      {children}
    </button>
  ),
}))

// Mock avatar components
jest.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, className }: any) => <div className={className}>{children}</div>,
  AvatarFallback: ({ children, className }: any) => <div className={className}>{children}</div>,
}))

// Mock config
jest.mock('../config', () => ({
  icons: {
    ChevronLeft: () => <div>ChevronLeft</div>,
  },
  safeMainNavigation: [
    {
      icon: () => <div>Wallet</div>,
      label: 'Overview',
      href: '/home',
      isActive: false,
    },
    {
      icon: () => <div>Transactions</div>,
      label: 'Transactions',
      href: '/transactions',
      isActive: false,
      badge: 2,
    },
  ],
  safeDefiGroup: {
    label: 'Defi',
    items: [
      {
        icon: () => <div>Swap</div>,
        label: 'Swap',
        href: '/swap',
        isActive: false,
      },
    ],
  },
}))

describe('SafeSidebarVariant', () => {
  const mockSpace: SpaceItem = {
    id: 1,
    name: 'Test Safe',
  }

  it('renders space selector with name and back button', () => {
    render(<SafeSidebarVariant spaceName="My Safe Account" spaceInitial="M" selectedSpace={mockSpace} />)

    expect(screen.getByText('My Safe Account')).toBeInTheDocument()
    expect(screen.getByText('Space')).toBeInTheDocument()
    expect(screen.getByText('M')).toBeInTheDocument()
    expect(screen.getByText('ChevronLeft')).toBeInTheDocument()
  })

  it('derives initial from space name when spaceInitial not provided', () => {
    render(<SafeSidebarVariant spaceName="MySpace" selectedSpace={mockSpace} />)

    expect(screen.getByText('M')).toBeInTheDocument()
  })

  it('uses provided spaceInitial when available', () => {
    render(<SafeSidebarVariant spaceName="MySpace" spaceInitial="X" selectedSpace={mockSpace} />)

    expect(screen.getByText('X')).toBeInTheDocument()
  })

  it('renders all navigation sections', () => {
    render(<SafeSidebarVariant spaceName="Test Safe" spaceInitial="T" selectedSpace={mockSpace} />)

    expect(screen.getByText('Overview')).toBeInTheDocument()
    expect(screen.getAllByText('Transactions').length).toBeGreaterThan(0)
    expect(screen.getByLabelText('2 Transactions notifications')).toBeInTheDocument()
    expect(screen.getByText('Defi')).toBeInTheDocument()
    expect(screen.getAllByText('Swap').length).toBeGreaterThan(0)
  })

  it('handles undefined space name', () => {
    render(<SafeSidebarVariant spaceInitial="U" selectedSpace={mockSpace} />)

    expect(screen.getByText('U')).toBeInTheDocument()
  })
})
