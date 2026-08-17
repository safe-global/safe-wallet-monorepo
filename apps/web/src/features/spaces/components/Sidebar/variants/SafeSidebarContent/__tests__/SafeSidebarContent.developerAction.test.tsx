import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { SafeSidebarContent } from '../SafeSidebarContent'

// Companion to SafeSidebarContent.test.tsx, which mocks SafeSidebarVariant away. Here the real
// SafeSidebarVariant and the real NavItem stay in place, so the Feature flags entry is exercised
// the way a user hits it: config -> action group -> NavItem -> onSelect -> dialog. Only leaf
// concerns (sidebar/tooltip primitives, analytics, data hooks, the dialog itself) are stubbed.

const mockPush = jest.fn()

jest.mock('next/router', () => ({
  useRouter: () => ({ query: {}, pathname: '/home', push: mockPush }),
}))

jest.mock('@/hooks/useTxQueue', () => ({
  useQueuedTxsLength: () => '',
}))

jest.mock('@/hooks/useChains', () => ({
  useCurrentChain: () => ({ chainId: '1' }),
}))

jest.mock('@/utils/chains', () => ({
  isRouteEnabled: () => true,
}))

jest.mock('@safe-global/utils/utils/chains', () => ({
  isNonCriticalUpdate: () => false,
}))

jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: () => ({ safe: { deployed: true, implementationVersionState: 'UP_TO_DATE', version: '1.4.1' } }),
}))

jest.mock('@/hooks/useSafeAddressFromUrl', () => ({
  useSafeQueryParam: () => '',
}))

// Selector-aware so real selectors run against a known slice: the override count resolves to 0 and
// isAuthenticated to false (keeping the workspace header out of the way) without a blanket stub that
// would also swallow any future store consumer in this tree.
jest.mock('@/store', () => ({
  useAppSelector: (selector: (state: { featureFlagOverrides: Record<string, boolean>; auth: object }) => unknown) =>
    selector({ featureFlagOverrides: {}, auth: {} }),
}))

jest.mock('@/features/counterfactual', () => ({
  useIsCounterfactualSafe: () => false,
}))

jest.mock('@/hooks/useIsHydrated', () => ({
  useIsHydrated: () => true,
}))

jest.mock('../../../NewTransactionButton', () => ({
  SidebarActionButton: () => <button type="button">New transaction</button>,
}))

jest.mock('../../SafeSidebarWorkspaceHeader', () => ({
  SafeSidebarWorkspaceHeader: () => null,
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

describe('SafeSidebarContent Developer action (real NavItem)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the Feature flags entry as a button, not a navigation link', () => {
    render(<SafeSidebarContent spaceInitial="S" spaces={[]} />)

    const item = screen.getByTestId('sidebar-feature-flags-item')
    expect(item.tagName).toBe('BUTTON')
    expect(item).not.toHaveAttribute('href')
    expect(item).toHaveTextContent('Feature flags')
  })

  it('opens the editor dialog on click without routing anywhere', () => {
    render(<SafeSidebarContent spaceInitial="S" spaces={[]} />)

    expect(screen.queryByTestId('feature-flag-editor-dialog')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('sidebar-feature-flags-item'))

    expect(screen.getByTestId('feature-flag-editor-dialog')).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
    // Proves the click ran through the real NavItem handler rather than a bare onSelect prop.
    expect(mockTrackEvent).toHaveBeenCalledWith({ action: 'Sidebar clicked' }, { sidebarElement: 'Feature flags' })
  })

  it('keeps regular nav items as links so the action item is genuinely the odd one out', () => {
    render(<SafeSidebarContent spaceInitial="S" spaces={[]} />)

    expect(screen.getAllByRole('link').length).toBeGreaterThan(0)
  })
})
