import { render, screen } from '@testing-library/react'
import { House } from 'lucide-react'
import type { ReactElement, ReactNode } from 'react'
import type { ResolvedSidebarItem } from '../types'
import { NavItem } from '../variants/NavItem'

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  TooltipContent: ({ children }: { children: ReactNode }) => <div role="tooltip">{children}</div>,
}))

// Mock sidebar UI components
jest.mock('@/components/ui/sidebar', () => ({
  SidebarMenuItem: ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  SidebarMenuButton: ({
    children,
    isActive,
    disabled,
    render: renderProp,
    className,
    'data-testid': testId,
  }: {
    children: ReactNode
    isActive?: boolean
    disabled?: boolean
    render?: ReactElement<{ href: string | { pathname?: string } }>
    className?: string
    'data-testid'?: string
  }) => {
    if (renderProp && !disabled) {
      // Next.js Link href can be a string or { pathname, query } object
      const rawHref = renderProp.props.href
      const href = typeof rawHref === 'string' ? rawHref : (rawHref?.pathname ?? '')
      return (
        <a href={href} data-testid={testId} className={className} data-active={isActive}>
          {children}
        </a>
      )
    }

    return (
      <button data-testid={testId} className={className} data-active={isActive} disabled={disabled}>
        {children}
      </button>
    )
  },
}))

describe('NavItem', () => {
  const baseItem: ResolvedSidebarItem = {
    icon: House,
    label: 'Home',
    href: '/home',
    link: { pathname: '/home', query: {} },
    isActive: false,
    disabled: false,
  }

  it('renders with icon and label', () => {
    const { container } = render(<NavItem item={baseItem} />)

    expect(container.querySelector('svg')).toBeInTheDocument()
    expect(screen.getByText('Home')).toBeInTheDocument()
  })

  it('renders as a link when not disabled', () => {
    render(<NavItem item={baseItem} />)

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/home')
  })

  it('renders as a button when disabled', () => {
    const disabledItem = { ...baseItem, disabled: true }
    render(<NavItem item={disabledItem} />)

    const button = screen.getByTestId('sidebar-list-item')
    expect(button).toBeDisabled()
  })

  it('shows tooltip when disabled', () => {
    const disabledItem = { ...baseItem, disabled: true }
    render(<NavItem item={disabledItem} />)

    expect(screen.getByText('You need to activate your Safe first.')).toBeInTheDocument()
  })

  it('sets data-active attribute when isActive is true', () => {
    const activeItem = { ...baseItem, isActive: true }
    render(<NavItem item={activeItem} />)

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('data-active', 'true')
  })

  it('does not render badge when badge is undefined', () => {
    render(<NavItem item={baseItem} />)

    // Should not have any span with badge number
    expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument()
  })

  it('does not render badge when badge is 0', () => {
    const itemWithZeroBadge = { ...baseItem, badge: 0 }
    render(<NavItem item={itemWithZeroBadge} />)

    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('renders badge with correct count', () => {
    const itemWithBadge = { ...baseItem, badge: 5 }
    render(<NavItem item={itemWithBadge} />)

    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('renders badge dot with aria-hidden', () => {
    const itemWithBadge = { ...baseItem, badge: 3 }
    const { container } = render(<NavItem item={itemWithBadge} />)

    const dot = container.querySelector('[aria-hidden]')
    expect(dot).toBeInTheDocument()
  })

  it('preserves href in link when badge is present', () => {
    const itemWithBadge = {
      ...baseItem,
      href: '/transactions',
      badge: 5,
      link: { pathname: '/transactions', query: {} },
    }
    render(<NavItem item={itemWithBadge} />)

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/transactions')
  })
})
