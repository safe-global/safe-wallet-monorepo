import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { SidebarSkeleton } from '../SidebarSkeleton'

jest.mock('@/components/ui/sidebar', () => ({
  Sidebar: ({ children }: { children: ReactNode }) => <div data-testid="sidebar">{children}</div>,
  SidebarContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarGroup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarGroupContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarMenuItem: ({ children }: { children: ReactNode }) => <div data-testid="skeleton-row">{children}</div>,
}))

jest.mock('../SidebarTopBar', () => ({
  SidebarTopBar: () => <div data-testid="sidebar-top-bar">Top Bar</div>,
}))

describe('SidebarSkeleton', () => {
  it('renders sidebar top bar and skeleton rows', () => {
    render(<SidebarSkeleton />)

    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('sidebar-top-bar')).toBeInTheDocument()
    expect(screen.getAllByTestId('skeleton-row')).toHaveLength(8)
  })
})
