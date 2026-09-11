import { render, screen, fireEvent } from '@testing-library/react'
import React, { type ReactNode } from 'react'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { SidebarCommonFooter } from '../SidebarCommonFooter'

const mockUseAppDispatch = jest.fn()
const mockUseDarkMode = jest.fn()
const mockTrackEvent = jest.fn()

let mockHasBeamerConsent = true

jest.mock('@/services/analytics', () => ({
  trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
  OVERVIEW_EVENTS: {
    HELP_CENTER: { action: 'Open Help Center' },
    WHATS_NEW: { action: "Open What's New" },
  },
  MixpanelEventParams: { SIDEBAR_ELEMENT: 'sidebarElement' },
}))

jest.mock('@/store', () => ({
  useAppDispatch: () => mockUseAppDispatch(),
  useAppSelector: () => mockHasBeamerConsent,
}))

jest.mock('@/hooks/useDarkMode', () => ({
  useDarkMode: () => mockUseDarkMode(),
}))

jest.mock('@/components/common/HelpMenu', () => ({
  __esModule: true,
  default: ({ anchorEl, onClose }: { anchorEl: HTMLElement | null; onClose: () => void }) =>
    anchorEl ? <div data-testid="help-menu" role="menu" onClick={onClose} /> : null,
}))

// Mock sidebar UI components
jest.mock('@/components/ui/sidebar', () => ({
  SidebarFooter: ({ children, 'data-testid': testId }: { children: ReactNode; 'data-testid'?: string }) => (
    <div data-testid={testId}>{children}</div>
  ),
  SidebarMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarMenuItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarMenuButton: ({
    children,
    className,
    id,
    type = 'button',
    'data-testid': testId,
    'aria-label': ariaLabel,
    onClick,
  }: {
    children?: ReactNode
    className?: string
    id?: string
    type?: 'button' | 'submit' | 'reset'
    'data-testid'?: string
    'aria-label'?: string
    onClick?: React.MouseEventHandler<HTMLButtonElement>
  }) => (
    <button type={type} id={id} data-testid={testId} className={className} aria-label={ariaLabel} onClick={onClick}>
      {children}
    </button>
  ),
}))

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipTrigger: ({
    children,
    render,
    className,
  }: {
    children: ReactNode
    render?: React.ReactElement<{ children?: ReactNode }>
    className?: string
  }) => (render ? React.cloneElement(render, {}, children) : <div className={className}>{children}</div>),
  TooltipContent: ({ children }: { children: ReactNode }) => <div role="tooltip">{children}</div>,
}))

jest.mock('@/components/ui/switch', () => ({
  Switch: ({
    id,
    checked,
    onCheckedChange,
  }: {
    id: string
    checked: boolean
    onCheckedChange: (checked: boolean) => void
  }) => (
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(event) => onCheckedChange(event.target.checked)}
      data-testid={id}
    />
  ),
}))

jest.mock('@/components/ui/field', () => ({
  Field: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  FieldLabel: ({ children, htmlFor }: { children: ReactNode; htmlFor: string }) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
}))

let isProductionMock = true
jest.mock('@/config/constants', () => ({
  get IS_PRODUCTION() {
    return isProductionMock
  },
}))

// Mock icons
jest.mock('../../config', () => ({
  icons: {
    CircleHelp: () => <div data-testid="help-icon">CircleHelp</div>,
  },
}))

jest.mock('../../ApiCtaSidebar', () => ({
  ApiCtaSidebar: () => <div data-testid="api-cta-sidebar" />,
}))

let mockIsSafeProEnabled = false
let mockIsSafeProBannerDismissed = false
const mockDismissSafeProBanner = jest.fn()
jest.mock('@/features/safe-pro-announcement', () => ({
  SafeProFeature: { name: 'safe-pro-announcement' },
  useIsSafeProEnabled: () => mockIsSafeProEnabled,
  useSafeProSidebarBannerDismissed: () => [mockIsSafeProBannerDismissed, mockDismissSafeProBanner],
}))

let mockIsTwoFactorBannerEnabled = false
const mockTwoFactorBannerFlag = FEATURES.TWO_FACTOR_AWARENESS_BANNER
jest.mock('@/hooks/useChains', () => ({
  useHasFeature: (feature: string) => feature === mockTwoFactorBannerFlag && mockIsTwoFactorBannerEnabled,
}))

let mockSpaceId: string | null = 'space-uuid'
jest.mock('../../../../hooks/useCurrentSpaceId', () => ({
  useCurrentSpaceId: () => mockSpaceId,
}))

let mockIsTwoFactorCardDismissed = false
const mockDismissTwoFactorCard = jest.fn()
jest.mock('@/features/oidc-auth', () => ({
  OidcAuthFeature: { name: 'oidc-auth' },
  useTwoFactorAwarenessDismissed: () => [mockIsTwoFactorCardDismissed, mockDismissTwoFactorCard],
}))

let mockIsSafeProLoaded = true
let mockSafeProError: Error | undefined = undefined
let mockIsTwoFactorCardLoaded = true
let mockTwoFactorCardError: Error | undefined = undefined
jest.mock('@/features/__core__', () => ({
  useLoadFeature: (handle: { name: string }) =>
    handle.name === 'oidc-auth'
      ? {
          $isReady: mockIsTwoFactorCardLoaded,
          $error: mockTwoFactorCardError,
          WorkspaceTwoFactorAwarenessCard: ({
            className,
            spaceId,
            onDismiss,
          }: {
            className?: string
            spaceId?: string
            onDismiss: () => void
          }) => (
            <div data-testid="workspace-2fa-awareness-card" data-space-id={spaceId} className={className}>
              <button onClick={onDismiss}>Dismiss</button>
            </div>
          ),
        }
      : {
          $isReady: mockIsSafeProLoaded,
          $error: mockSafeProError,
          SafeProSidebarBanner: ({ className, onDismiss }: { className?: string; onDismiss?: () => void }) => (
            <div data-testid="safe-pro-sidebar-banner" className={className}>
              <button onClick={onDismiss}>Dismiss Safe Pro</button>
            </div>
          ),
        },
}))

jest.mock('../../SidebarIndexingStatus', () => ({
  SidebarIndexingStatus: () => <div data-testid="indexing-status" />,
}))

let mockPathname = '/spaces'
jest.mock('next/router', () => ({
  useRouter: () => ({ pathname: mockPathname }),
}))

jest.mock('@/services/beamer', () => ({
  BEAMER_SELECTOR: 'whats-new-button',
}))

describe('SidebarCommonFooter', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    isProductionMock = true
    mockHasBeamerConsent = true
    mockUseAppDispatch.mockReturnValue(jest.fn())
    mockUseDarkMode.mockReturnValue(false)
    mockIsSafeProEnabled = false
    mockIsSafeProBannerDismissed = false
    mockIsSafeProLoaded = true
    mockSafeProError = undefined
    mockIsTwoFactorCardLoaded = true
    mockTwoFactorCardError = undefined
    mockIsTwoFactorBannerEnabled = false
    mockIsTwoFactorCardDismissed = false
    mockSpaceId = 'space-uuid'
    mockPathname = '/spaces'
  })

  describe('2FA awareness card', () => {
    it('shows the card on the Workspaces sidebar when the flag is on', () => {
      mockIsTwoFactorBannerEnabled = true
      render(<SidebarCommonFooter />)

      expect(screen.getByTestId('workspace-2fa-awareness-card')).toHaveAttribute('data-space-id', 'space-uuid')
    })

    it('hides the card when the flag is off', () => {
      render(<SidebarCommonFooter />)

      expect(screen.queryByTestId('workspace-2fa-awareness-card')).not.toBeInTheDocument()
    })

    it('shows the card on the Safe sidebar when a space is known', () => {
      mockIsTwoFactorBannerEnabled = true
      render(<SidebarCommonFooter isSafeSidebar />)

      expect(screen.getByTestId('workspace-2fa-awareness-card')).toHaveAttribute('data-space-id', 'space-uuid')
    })

    it('hides the card when no space is known', () => {
      mockIsTwoFactorBannerEnabled = true
      mockSpaceId = null
      render(<SidebarCommonFooter />)

      expect(screen.queryByTestId('workspace-2fa-awareness-card')).not.toBeInTheDocument()
    })

    it('hides the card on the general settings page, which is where it links to', () => {
      mockIsTwoFactorBannerEnabled = true
      mockPathname = '/spaces/settings/general'
      render(<SidebarCommonFooter />)

      expect(screen.queryByTestId('workspace-2fa-awareness-card')).not.toBeInTheDocument()
    })

    it('hides the card once it was dismissed', () => {
      mockIsTwoFactorBannerEnabled = true
      mockIsTwoFactorCardDismissed = true
      render(<SidebarCommonFooter />)

      expect(screen.queryByTestId('workspace-2fa-awareness-card')).not.toBeInTheDocument()
    })

    it('dismisses the card through the shared dismissal state', () => {
      mockIsTwoFactorBannerEnabled = true
      render(<SidebarCommonFooter />)

      fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))

      expect(mockDismissTwoFactorCard).toHaveBeenCalledTimes(1)
    })

    it('renders the card above the API section', () => {
      mockIsTwoFactorBannerEnabled = true
      render(<SidebarCommonFooter />)

      const card = screen.getByTestId('workspace-2fa-awareness-card')
      const api = screen.getByTestId('api-cta-sidebar')
      expect(card.compareDocumentPosition(api) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })
  })

  describe('banner slot', () => {
    it('shows the Safe Pro banner and keeps the 2FA card invisible behind it while both are on', () => {
      mockIsTwoFactorBannerEnabled = true
      mockIsSafeProEnabled = true
      render(<SidebarCommonFooter />)

      expect(screen.getByTestId('safe-pro-sidebar-banner')).not.toHaveClass('invisible')
      expect(screen.getByTestId('workspace-2fa-awareness-card')).toHaveClass('invisible')
    })

    it('dismisses the Safe Pro banner through its persisted dismissal state', () => {
      mockIsSafeProEnabled = true
      render(<SidebarCommonFooter />)

      fireEvent.click(screen.getByRole('button', { name: 'Dismiss Safe Pro' }))

      expect(mockDismissSafeProBanner).toHaveBeenCalledTimes(1)
    })

    it('shows the 2FA card once the Safe Pro banner was dismissed', () => {
      mockIsTwoFactorBannerEnabled = true
      mockIsSafeProEnabled = true
      mockIsSafeProBannerDismissed = true
      render(<SidebarCommonFooter />)

      expect(screen.getByTestId('safe-pro-sidebar-banner')).toHaveClass('invisible')
      expect(screen.getByTestId('workspace-2fa-awareness-card')).not.toHaveClass('invisible')
    })

    it('leaves the slot out of the layout while the Safe Pro banner is still loading', () => {
      mockIsTwoFactorBannerEnabled = true
      mockIsSafeProEnabled = true
      mockIsSafeProLoaded = false
      render(<SidebarCommonFooter />)

      expect(screen.queryByTestId('safe-pro-sidebar-banner')).not.toBeInTheDocument()
      expect(screen.queryByTestId('workspace-2fa-awareness-card')).not.toBeInTheDocument()
    })

    it('gives the slot to the 2FA card when the Safe Pro banner fails to load', () => {
      mockIsTwoFactorBannerEnabled = true
      mockIsSafeProEnabled = true
      mockIsSafeProLoaded = false
      mockSafeProError = new Error('chunk load failed')
      render(<SidebarCommonFooter />)

      expect(screen.getByTestId('workspace-2fa-awareness-card')).not.toHaveClass('invisible')
    })

    it('keeps showing the 2FA card while Safe Pro loads, when Safe Pro was already dismissed', () => {
      mockIsTwoFactorBannerEnabled = true
      mockIsSafeProEnabled = true
      mockIsSafeProBannerDismissed = true
      mockIsSafeProLoaded = false
      render(<SidebarCommonFooter />)

      expect(screen.getByTestId('workspace-2fa-awareness-card')).not.toHaveClass('invisible')
    })

    it('leaves the slot out of the layout while the 2FA card is still loading', () => {
      mockIsTwoFactorBannerEnabled = true
      mockIsTwoFactorCardLoaded = false
      render(<SidebarCommonFooter />)

      expect(screen.queryByTestId('workspace-2fa-awareness-card')).not.toBeInTheDocument()
    })

    it('drops the 2FA card when its chunk fails to load', () => {
      mockIsTwoFactorBannerEnabled = true
      mockTwoFactorCardError = new Error('chunk load failed')
      render(<SidebarCommonFooter />)

      expect(screen.queryByTestId('workspace-2fa-awareness-card')).not.toBeInTheDocument()
    })

    it('shows the 2FA card where the Safe Pro banner hides itself', () => {
      mockIsTwoFactorBannerEnabled = true
      mockIsSafeProEnabled = true
      mockPathname = '/spaces/plans'
      render(<SidebarCommonFooter />)

      expect(screen.queryByTestId('safe-pro-sidebar-banner')).not.toBeInTheDocument()
      expect(screen.getByTestId('workspace-2fa-awareness-card')).toBeInTheDocument()
    })
  })

  describe('Safe Pro banner', () => {
    it('shows the banner on the Workspaces sidebar when the flag is on', () => {
      mockIsSafeProEnabled = true
      render(<SidebarCommonFooter />)

      expect(screen.getByTestId('safe-pro-sidebar-banner')).toBeInTheDocument()
    })

    it('shows the banner on the Safe sidebar when the flag is on', () => {
      mockIsSafeProEnabled = true
      render(<SidebarCommonFooter isSafeSidebar />)

      expect(screen.getByTestId('safe-pro-sidebar-banner')).toBeInTheDocument()
    })

    it('hides the banner on the Plans page, which is where it links to', () => {
      mockIsSafeProEnabled = true
      mockPathname = '/spaces/plans'
      render(<SidebarCommonFooter />)

      expect(screen.queryByTestId('safe-pro-sidebar-banner')).not.toBeInTheDocument()
    })

    it('hides the banner when the flag is off', () => {
      render(<SidebarCommonFooter />)

      expect(screen.queryByTestId('safe-pro-sidebar-banner')).not.toBeInTheDocument()
    })

    it('keeps the dismissed banner mounted but invisible, so the slot does not shrink', () => {
      mockIsSafeProEnabled = true
      mockIsSafeProBannerDismissed = true
      mockIsTwoFactorBannerEnabled = true
      render(<SidebarCommonFooter />)

      expect(screen.getByTestId('safe-pro-sidebar-banner')).toHaveClass('invisible')
    })

    it('drops the slot entirely once the dismissed banner has nothing to give way to', () => {
      mockIsSafeProEnabled = true
      mockIsSafeProBannerDismissed = true
      render(<SidebarCommonFooter />)

      expect(screen.queryByTestId('safe-pro-sidebar-banner')).not.toBeInTheDocument()
    })
  })

  it('fires HELP_CENTER tracking event when clicking the Help button', () => {
    render(<SidebarCommonFooter />)
    fireEvent.click(screen.getByTestId('list-item-need-help'))

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'Open Help Center' }),
      expect.objectContaining({ sidebarElement: 'Help Center' }),
    )
  })

  it("fires WHATS_NEW tracking event when clicking What's new", () => {
    render(<SidebarCommonFooter />)
    fireEvent.click(screen.getByTestId('list-item-whats-new'))

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: "Open What's New" }),
      expect.objectContaining({ sidebarElement: "What's New" }),
    )
  })

  it("dispatches open cookie banner when What's new is clicked without Beamer consent", () => {
    mockHasBeamerConsent = false
    const mockDispatch = jest.fn()
    mockUseAppDispatch.mockReturnValue(mockDispatch)

    render(<SidebarCommonFooter />)
    fireEvent.click(screen.getByTestId('list-item-whats-new'))

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: expect.stringMatching(/openCookieBanner/),
        payload: { warningKey: 'updates' },
      }),
    )
  })

  it('renders footer and help entry', () => {
    render(<SidebarCommonFooter />)

    expect(screen.getByTestId('sidebar-common-footer')).toBeInTheDocument()
    expect(screen.getByTestId('list-item-need-help')).toBeInTheDocument()
    expect(screen.getByTestId('list-item-whats-new')).toBeInTheDocument()
    expect(screen.getByTestId('help-icon')).toBeInTheDocument()
    expect(screen.getByText('Help')).toBeInTheDocument()
  })

  it('renders the indexing status next to Help', () => {
    render(<SidebarCommonFooter />)
    expect(screen.getByTestId('indexing-status')).toBeInTheDocument()
  })

  it('renders the Help center tooltip', () => {
    render(<SidebarCommonFooter />)
    expect(screen.getByRole('tooltip', { name: /Help center/i })).toBeInTheDocument()
  })

  it('opens help menu when Help button is clicked', () => {
    render(<SidebarCommonFooter />)

    expect(screen.queryByTestId('help-menu')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('list-item-need-help'))
    expect(screen.getByTestId('help-menu')).toBeInTheDocument()
  })

  it('closes help menu when onClose is called', () => {
    render(<SidebarCommonFooter />)

    fireEvent.click(screen.getByTestId('list-item-need-help'))
    expect(screen.getByTestId('help-menu')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('help-menu'))
    expect(screen.queryByTestId('help-menu')).not.toBeInTheDocument()
  })

  it('does not render dev toggles in production', () => {
    render(<SidebarCommonFooter />)

    expect(screen.queryByText('Dark mode')).not.toBeInTheDocument()
  })

  describe('dev mode (IS_PRODUCTION = false)', () => {
    beforeEach(() => {
      isProductionMock = false
    })

    it('renders the Dark mode toggle', () => {
      render(<SidebarCommonFooter />)

      expect(screen.getByRole('checkbox', { name: /Dark mode/i })).toBeInTheDocument()
    })
  })
})
