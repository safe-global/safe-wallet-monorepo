import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { SpacesSidebarContent } from '../SpacesSidebarContent'
import { setIsProduction } from '@/tests/env'

// Companion to SpacesSidebarContent.test.tsx, which mocks SpacesSidebarVariant away. Here the real
// SpacesSidebarVariant, the real developer-group hook and the real NavItem stay in place, so the
// Feature flags entry is exercised the way a user hits it on a space route: hook -> action group ->
// NavItem -> onSelect -> dialog. Only leaf concerns are stubbed.

const mockPush = jest.fn()

jest.mock('next/router', () => ({
  useRouter: () => ({ query: { spaceId: '1' }, pathname: '/spaces', push: mockPush }),
}))

jest.mock('@/features/spaces/hooks/useCurrentSpaceId', () => ({
  useCurrentSpaceId: () => '1',
}))

jest.mock('@/features/spaces/hooks/useSpaceMembers', () => ({
  useIsActiveMember: () => true,
}))

jest.mock('@/hooks/useChains', () => ({
  useHasFeature: () => true,
}))

// Selector-aware so real selectors run against a known slice, rather than every selector in the
// tree silently resolving to the same value and masking a future store consumer.
jest.mock('@/store', () => ({
  useAppSelector: (selector: (state: { featureFlagOverrides: Record<string, boolean>; auth: object }) => unknown) =>
    selector({ featureFlagOverrides: {}, auth: {} }),
}))

jest.mock('../../SpaceSelectorDropdown', () => ({
  SpaceSelectorDropdown: () => null,
}))

const mockTrackEvent = jest.fn()

jest.mock('@/services/analytics', () => ({
  trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
  OVERVIEW_EVENTS: { SIDEBAR_CLICKED: { action: 'Sidebar clicked' } },
  MixpanelEventParams: { SIDEBAR_ELEMENT: 'sidebarElement', ENTRY_POINT: 'entryPoint' },
}))

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: ReactNode }) => <span>{children}</span>,
  TooltipContent: () => null,
}))

jest.mock('@/components/ui/sidebar', () => ({
  useSidebar: () => ({ state: 'expanded', isMobile: false, isTablet: false, setOpenMobile: jest.fn() }),
  SidebarContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarGroup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarGroupLabel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarGroupContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarMenuItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarSeparator: () => null,
  // Mirrors the real primitive's two shapes so NavItem's link-vs-button decision stays observable.
  SidebarMenuButton: ({
    children,
    render: renderProp,
    'data-testid': testId,
    onClick,
  }: {
    children: ReactNode
    render?: ReactElement<{ href: string | { pathname?: string } }>
    'data-testid'?: string
    onClick?: () => void
  }) => {
    if (renderProp) {
      const rawHref = renderProp.props.href
      return (
        <a href={typeof rawHref === 'string' ? rawHref : (rawHref?.pathname ?? '')} data-testid={testId}>
          {children}
        </a>
      )
    }
    return (
      <button type="button" data-testid={testId} onClick={onClick}>
        {children}
      </button>
    )
  },
}))

jest.mock('@/features/feature-flag-overrides/FeatureFlagEditorDialogLoader', () => ({
  FeatureFlagEditorDialogLoader: ({ open }: { open: boolean }) =>
    open ? <div data-testid="feature-flag-editor-dialog" /> : null,
}))

const renderContent = () => render(<SpacesSidebarContent spaceInitial="T" spaces={[]} />)

describe('SpacesSidebarContent Developer action (real NavItem)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the Developer group with the Feature flags entry', () => {
    renderContent()

    expect(screen.getByText('Developer')).toBeInTheDocument()
    expect(screen.getByTestId('sidebar-feature-flags-item')).toHaveTextContent('Feature flags')
  })

  it('renders the Feature flags entry as a button, not a navigation link', () => {
    renderContent()

    const item = screen.getByTestId('sidebar-feature-flags-item')
    expect(item.tagName).toBe('BUTTON')
    expect(item).not.toHaveAttribute('href')
  })

  it('opens the editor dialog on click without routing anywhere', () => {
    renderContent()

    expect(screen.queryByTestId('feature-flag-editor-dialog')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('sidebar-feature-flags-item'))

    expect(screen.getByTestId('feature-flag-editor-dialog')).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
    // Proves the click ran through the real NavItem handler rather than a bare onSelect prop.
    expect(mockTrackEvent).toHaveBeenCalledWith({ action: 'Sidebar clicked' }, { sidebarElement: 'Feature flags' })
  })

  it('keeps the space nav items as links so the action item is genuinely the odd one out', () => {
    renderContent()

    expect(screen.getAllByRole('link').length).toBeGreaterThan(0)
  })

  it('renders neither the group nor the dialog in production', () => {
    const originalIsProduction = process.env.NEXT_PUBLIC_IS_PRODUCTION
    setIsProduction('true')

    try {
      renderContent()

      expect(screen.queryByText('Developer')).not.toBeInTheDocument()
      expect(screen.queryByTestId('sidebar-feature-flags-item')).not.toBeInTheDocument()
      expect(screen.queryByTestId('feature-flag-editor-dialog')).not.toBeInTheDocument()
    } finally {
      setIsProduction(originalIsProduction)
    }
  })
})
