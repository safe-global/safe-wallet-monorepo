import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { SidebarCommonFooter } from '../SidebarCommonFooter'

// Mock sidebar UI components
jest.mock('@/components/ui/sidebar', () => ({
  SidebarFooter: ({ children, 'data-testid': testId }: { children: ReactNode; 'data-testid'?: string }) => (
    <div data-testid={testId}>{children}</div>
  ),
  SidebarMenu: ({ children, 'data-testid': testId }: { children: ReactNode; 'data-testid'?: string }) => (
    <div data-testid={testId}>{children}</div>
  ),
  SidebarMenuItem: ({ children, 'data-testid': testId }: { children: ReactNode; 'data-testid'?: string }) => (
    <div data-testid={testId}>{children}</div>
  ),
  SidebarMenuButton: ({ children, render: renderProp, className, 'data-testid': testId }: any) => (
    <button
      data-testid={testId}
      className={className}
      {...(renderProp
        ? { as: 'a', href: 'https://help.safe.global/en/', target: '_blank', rel: 'noopener noreferrer' }
        : {})}
    >
      {children}
    </button>
  ),
  SidebarMenuAction: ({ children, className, 'data-testid': testId }: any) => (
    <div data-testid={testId} className={className}>
      {children}
    </div>
  ),
}))

// Mock icons
jest.mock('../config', () => ({
  icons: {
    CircleHelp: ({ 'data-testid': testId }: any) => <div data-testid={testId}>CircleHelp</div>,
    EllipsisVertical: ({ 'data-testid': testId }: any) => <div data-testid={testId}>EllipsisVertical</div>,
  },
}))

describe('SidebarCommonFooter', () => {
  it('renders all required elements', () => {
    render(<SidebarCommonFooter />)

    expect(screen.getByTestId('sidebar-common-footer')).toBeInTheDocument()
    expect(screen.getByTestId('footer-menu')).toBeInTheDocument()
    expect(screen.getByTestId('help-menu-item')).toBeInTheDocument()
    expect(screen.getByTestId('help-menu-button')).toBeInTheDocument()
    expect(screen.getByTestId('help-icon')).toBeInTheDocument()
    expect(screen.getByTestId('help-menu-action')).toBeInTheDocument()
    expect(screen.getByTestId('ellipsis-icon')).toBeInTheDocument()
  })

  it('renders help link with correct attributes', () => {
    render(<SidebarCommonFooter />)

    const button = screen.getByTestId('help-menu-button')
    expect(button).toHaveAttribute('href', 'https://help.safe.global/en/')
    expect(button).toHaveAttribute('target', '_blank')
    expect(button).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getByText('Help')).toBeInTheDocument()
  })

  it('includes accessible text for screen readers', () => {
    render(<SidebarCommonFooter />)

    const srOnlyElement = screen.getByText('More options')
    expect(srOnlyElement).toHaveClass('sr-only')
  })
})
