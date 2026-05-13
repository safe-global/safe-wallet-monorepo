import { render, screen, fireEvent } from '@testing-library/react'
import { House } from 'lucide-react'
import type { ReactElement, ReactNode } from 'react'
import type { ResolvedSidebarItem } from '../../../types'
import { NavItem } from '../NavItem'

const mockTrackEvent = jest.fn()

jest.mock('@/services/analytics', () => ({
  trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
  OVERVIEW_EVENTS: { SIDEBAR_CLICKED: { action: 'Sidebar clicked' } },
  MixpanelEventParams: { SIDEBAR_ELEMENT: 'sidebarElement', ENTRY_POINT: 'entryPoint' },
}))

jest.mock('@/services/analytics/ga-mixpanel-mapping', () => ({
  GA_LABEL_TO_MIXPANEL_PROPERTY: { sidebar: 'Sidebar' },
}))

jest.mock('@/services/analytics/events/swaps', () => ({
  SWAP_EVENTS: { OPEN_SWAPS: { action: 'Open Swaps' } },
  SWAP_LABELS: { sidebar: 'sidebar' },
}))

jest.mock('@/services/analytics/events/bridge', () => ({
  BRIDGE_EVENTS: { OPEN_BRIDGE: { action: 'Open Bridge' } },
  BRIDGE_LABELS: { sidebar: 'sidebar' },
}))

jest.mock('@/services/analytics/events/stake', () => ({
  STAKE_EVENTS: { OPEN_STAKE: { action: 'Open Stake' } },
  STAKE_LABELS: { sidebar: 'sidebar' },
}))

jest.mock('@/services/analytics/events/earn', () => ({
  EARN_EVENTS: { OPEN_EARN_PAGE: { action: 'Open Earn' } },
  EARN_LABELS: { sidebar: 'sidebar' },
}))

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
    onClick,
  }: {
    children: ReactNode
    isActive?: boolean
    disabled?: boolean
    render?: ReactElement<{ href: string | { pathname?: string } }>
    className?: string
    'data-testid'?: string
    onClick?: () => void
  }) => {
    if (renderProp && !disabled) {
      // Next.js Link href can be a string or { pathname, query } object
      const rawHref = renderProp.props.href
      const href = typeof rawHref === 'string' ? rawHref : (rawHref?.pathname ?? '')
      return (
        <a href={href} data-testid={testId} className={className} data-active={isActive} onClick={onClick}>
          {children}
        </a>
      )
    }

    return (
      <button data-testid={testId} className={className} data-active={isActive} disabled={disabled} onClick={onClick}>
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

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders with icon and label', () => {
    const { container } = render(<NavItem item={baseItem} />)

    expect(container.querySelector('svg')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveTextContent('Home')
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

  it('uses per-label test id when isSpacesVariant', () => {
    render(<NavItem item={baseItem} isSpacesVariant />)

    expect(screen.getByTestId('sidebar-item-home')).toBeInTheDocument()
  })

  it('does not show Safe activation tooltip when disabled and isSpacesVariant', () => {
    const disabledItem = { ...baseItem, disabled: true }
    render(<NavItem item={disabledItem} isSpacesVariant />)

    expect(screen.queryByText('You need to activate your Safe first.')).not.toBeInTheDocument()
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

  it('renders a masked string badge such as "20+" without coercing to NaN', () => {
    const itemWithMaskedBadge = { ...baseItem, badge: '20+' }
    render(<NavItem item={itemWithMaskedBadge} />)

    expect(screen.getByText('20+')).toBeInTheDocument()
  })

  it('does not render badge when badge is an empty string', () => {
    const itemWithEmptyBadge = { ...baseItem, badge: '' }
    render(<NavItem item={itemWithEmptyBadge} />)

    expect(screen.queryByTestId('queued-tx-info')).not.toBeInTheDocument()
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

  describe('tracking events', () => {
    it('fires SIDEBAR_CLICKED on click for a regular nav item', () => {
      render(<NavItem item={baseItem} />)
      fireEvent.click(screen.getByRole('link'))

      expect(mockTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'Sidebar clicked' }),
        expect.objectContaining({ sidebarElement: 'Home' }),
      )
    })

    it('does not fire tracking events when item is disabled', () => {
      render(<NavItem item={{ ...baseItem, disabled: true }} />)
      fireEvent.click(screen.getByRole('button'))

      expect(mockTrackEvent).not.toHaveBeenCalled()
    })

    it('fires OPEN_BRIDGE and SIDEBAR_CLICKED when clicking the Bridge nav item', () => {
      const bridgeItem = { ...baseItem, href: '/bridge', link: { pathname: '/bridge', query: {} } }
      render(<NavItem item={bridgeItem} />)
      fireEvent.click(screen.getByRole('link'))

      expect(mockTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'Open Bridge', label: 'sidebar' }),
        undefined,
      )
      expect(mockTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'Sidebar clicked' }),
        expect.objectContaining({ sidebarElement: 'Home' }),
      )
    })

    it('fires OPEN_SWAPS with ENTRY_POINT mixpanel param when clicking the Swap nav item', () => {
      const swapItem = { ...baseItem, href: '/swap', link: { pathname: '/swap', query: {} } }
      render(<NavItem item={swapItem} />)
      fireEvent.click(screen.getByRole('link'))

      expect(mockTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'Open Swaps', label: 'sidebar' }),
        expect.objectContaining({ entryPoint: 'Sidebar' }),
      )
    })

    it('fires OPEN_STAKE and SIDEBAR_CLICKED when clicking the Stake nav item', () => {
      const stakeItem = { ...baseItem, href: '/stake', link: { pathname: '/stake', query: {} } }
      render(<NavItem item={stakeItem} />)
      fireEvent.click(screen.getByRole('link'))

      expect(mockTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'Open Stake', label: 'sidebar' }),
        undefined,
      )
    })

    it('fires OPEN_EARN_PAGE and SIDEBAR_CLICKED when clicking the Earn nav item', () => {
      const earnItem = { ...baseItem, href: '/earn', link: { pathname: '/earn', query: {} } }
      render(<NavItem item={earnItem} />)
      fireEvent.click(screen.getByRole('link'))

      expect(mockTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'Open Earn', label: 'sidebar' }),
        undefined,
      )
    })
  })
})
