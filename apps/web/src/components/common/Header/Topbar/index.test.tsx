import Topbar, {
  SAFE_BAR_ACTIONS_WRAP,
  SAFE_BAR_CONTEXT_HEIGHT,
  SAFE_BAR_CONTEXT_WRAP,
  SEARCH_ACTIONS_WRAP,
  SEARCH_CONTEXT_HEIGHT,
  SEARCH_CONTEXT_WRAP,
} from './index'
import * as contracts from '@/features/__core__'
import { render, screen } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import type { Notification } from '@/store/notificationsSlice'
import type { RootState } from '@/store'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { TxModalContext, type TxModalContextType } from '@/components/tx-flow'

jest.mock('@/features/__core__', () => ({
  ...jest.requireActual('@/features/__core__'),
  useLoadFeature: jest.fn(),
}))

const mockWallet = { address: '0x1234567890abcdef1234567890abcdef12345678', balance: '0' }

const mockUseIsMobile = jest.fn(() => false)
jest.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => mockUseIsMobile(),
}))

const mockUseIsBelowMd = jest.fn(() => false)
jest.mock('@/hooks/useMediaQuery', () => ({
  ...jest.requireActual('@/hooks/useMediaQuery'),
  useIsBelowMd: () => mockUseIsBelowMd(),
}))

jest.mock('@/features/wallet', () => ({
  WalletFeature: { name: 'wallet' },
  useWalletPopover: () => ({
    wallet: mockWallet,
    open: false,
    anchorEl: null,
    handleClick: jest.fn(),
    handleClose: jest.fn(),
  }),
}))

jest.mock('@/features/walletconnect', () => ({
  WalletConnectFeature: { name: 'walletconnect' },
}))

jest.mock('@/features/batching', () => ({
  useDraftBatch: () => [],
}))

jest.mock('@/hooks/useSafeAddress', () => ({
  __esModule: true,
  default: () => '',
}))

const mockUseSafeAddressFromUrl = jest.fn<string, []>(() => '')
jest.mock('@/hooks/useSafeAddressFromUrl', () => ({
  useSafeAddressFromUrl: () => mockUseSafeAddressFromUrl(),
}))

jest.mock('@/hooks/useIsSafeOwner', () => ({
  __esModule: true,
  default: () => false,
}))

jest.mock('@/hooks/useProposers', () => ({
  useIsWalletProposer: () => false,
}))

const mockIsSpaceRoute = jest.fn(() => true)
jest.mock('@/hooks/useIsSpaceRoute', () => ({
  useIsSpaceRoute: () => mockIsSpaceRoute(),
}))

const mockUsePathname = jest.fn<string, []>(() => '/home')
jest.mock('next/navigation', () => ({
  ...jest.requireActual('next/navigation'),
  usePathname: () => mockUsePathname(),
}))

jest.mock('@/components/common/SpaceSafeBar', () => {
  const MockSpaceSafeBar = () => <div data-testid="space-safe-bar" />
  MockSpaceSafeBar.displayName = 'SpaceSafeBar'
  return { __esModule: true, default: MockSpaceSafeBar }
})

jest.mock('@/components/settings/PushNotifications/hooks/useShowNotificationsRenewalMessage', () => ({
  useShowNotificationsRenewalMessage: jest.fn(),
}))

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
  OVERVIEW_EVENTS: {
    NOTIFICATION_CENTER: 'notification_center',
    OPEN_ONBOARD: { action: 'Open wallet modal', category: 'overview' },
  },
  OVERVIEW_LABELS: { top_bar: 'top_bar' },
  BATCH_EVENTS: { BATCH_SIDEBAR_OPEN: { action: 'Batch sidebar open', category: 'batching' } },
}))

jest.mock('@/services/analytics/events/spaces', () => ({
  SPACE_EVENTS: {
    WALLET_SWITCHED: { action: 'wallet_switched', category: 'spaces' },
    WALLET_DISCONNECTED: { action: 'wallet_disconnected', category: 'spaces' },
  },
}))

const mockUseCurrentSpaceId = jest.fn<string | null, []>(() => 'space-42')
jest.mock('@/features/spaces', () => ({
  useCurrentSpaceId: () => mockUseCurrentSpaceId(),
  get HeaderNavigation() {
    return jest.requireActual('@/features/spaces/components/HeaderNavigation').HeaderNavigation
  },
  HeaderAccountInfo: () => <div data-testid="header-account-info" />,
}))

jest.mock(
  '@/components/notification-center/NotificationCenterList',
  () =>
    function NotificationCenterList() {
      return <div>NotificationCenterList</div>
    },
)

const createNotification = (overrides: Partial<Notification> = {}): Notification => ({
  id: Math.random().toString(32).slice(2),
  message: 'Test notification',
  groupKey: 'test',
  variant: 'info',
  timestamp: Date.now(),
  isRead: false,
  isDismissed: false,
  ...overrides,
})

const mockUseLoadFeature = contracts.useLoadFeature as jest.Mock

describe('Topbar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseIsMobile.mockReturnValue(false)
    mockUseIsBelowMd.mockReturnValue(false)
    mockIsSpaceRoute.mockReturnValue(true)
    mockUsePathname.mockReturnValue('/home')
    mockUseSafeAddressFromUrl.mockReturnValue('')
    mockUseLoadFeature.mockReturnValue({
      WalletPopover: () => null,
      GlobalSearchModal: () => null,
      GlobalSearchInput: () => null,
      WalletConnectWidget: () => null,
    })
  })

  it('renders the wallet address in HeaderNavigation', () => {
    render(<Topbar />)
    expect(screen.getByText('0x1234...5678')).toBeInTheDocument()
  })

  it('renders notification badge when there are unread notifications', () => {
    const initialReduxState: Partial<RootState> = {
      notifications: [createNotification(), createNotification()],
    }

    render(<Topbar />, { initialReduxState })

    expect(screen.getByLabelText('2 unread messages')).toBeInTheDocument()
  })

  it('does not render notification badge when there are no unread notifications', () => {
    render(<Topbar />)
    expect(screen.queryByLabelText(/unread messages/)).not.toBeInTheDocument()
  })

  it('does not count read notifications in the badge', () => {
    const initialReduxState: Partial<RootState> = {
      notifications: [createNotification({ isRead: true }), createNotification()],
    }

    render(<Topbar />, { initialReduxState })

    expect(screen.getByLabelText('1 unread messages')).toBeInTheDocument()
  })

  describe('route-based left content', () => {
    it('does not render SpaceSafeBar on space routes', () => {
      mockIsSpaceRoute.mockReturnValue(true)
      render(<Topbar />)
      expect(screen.queryByTestId('space-safe-bar')).not.toBeInTheDocument()
    })

    it('renders SpaceSafeBar on non-space routes', () => {
      mockIsSpaceRoute.mockReturnValue(false)
      render(<Topbar />)
      expect(screen.getByTestId('space-safe-bar')).toBeInTheDocument()
    })

    it('renders SpaceSafeBar on space routes when a transaction modal is open', () => {
      mockIsSpaceRoute.mockReturnValue(true)
      const txModalValue: TxModalContextType = {
        txFlow: <div data-testid="mock-tx-flow" />,
        setTxFlow: jest.fn(),
        setFullWidth: jest.fn(),
      }
      render(
        <TxModalContext.Provider value={txModalValue}>
          <Topbar />
        </TxModalContext.Provider>,
      )
      expect(screen.getByTestId('space-safe-bar')).toBeInTheDocument()
    })

    it('renders SafeLogo on settings routes when no safe address is in the URL', () => {
      mockIsSpaceRoute.mockReturnValue(false)
      mockUsePathname.mockReturnValue('/settings/setup')
      mockUseSafeAddressFromUrl.mockReturnValue('')
      const { container } = render(<Topbar />)
      expect(screen.queryByTestId('space-safe-bar')).not.toBeInTheDocument()
      expect(screen.getByTestId('logo-image')).toBeInTheDocument()
      // Logo row is short — header centers items vertically so the logo aligns with the right-side button group
      expect(container.querySelector('header')?.className).toMatch(/items-center/)
      expect(container.querySelector('header')?.className).not.toMatch(/items-start/)
    })

    it('renders SpaceSafeBar on settings routes when a safe address is in the URL', () => {
      mockIsSpaceRoute.mockReturnValue(false)
      mockUsePathname.mockReturnValue('/settings/setup')
      mockUseSafeAddressFromUrl.mockReturnValue('0x1234567890abcdef1234567890abcdef12345678')
      const { container } = render(<Topbar />)
      expect(screen.getByTestId('space-safe-bar')).toBeInTheDocument()
      expect(screen.queryByTestId('logo-image')).not.toBeInTheDocument()
      // Default top alignment is preserved when the SpaceSafeBar is shown
      expect(container.querySelector('header')?.className).toMatch(/items-start/)
    })

    it.each([['/welcome/accounts'], ['/welcome/spaces']])(
      'renders SafeLogo instead of the search input on %s',
      (pathname) => {
        mockIsSpaceRoute.mockReturnValue(false)
        mockUsePathname.mockReturnValue(pathname)
        const { container } = render(<Topbar />)
        expect(screen.getByTestId('logo-image')).toBeInTheDocument()
        expect(screen.queryByTestId('space-safe-bar')).not.toBeInTheDocument()
        // The compact logo aligns with the action group instead of top-anchoring the selector row
        expect(container.querySelector('header')?.className).toMatch(/items-center/)
      },
    )

    it('keeps the compact logo inline but wraps the wide selector on narrow headers', () => {
      mockIsSpaceRoute.mockReturnValue(false)
      mockUsePathname.mockReturnValue('/welcome/accounts')
      const { container: logoContainer } = render(<Topbar />)
      // The logo group must not take a full-width row that pushes it below the actions
      expect(logoContainer.querySelector('header')?.outerHTML).not.toMatch(/basis-full/)

      // The wide left content (selector/search) still drops to its own row when cramped
      mockIsSpaceRoute.mockReturnValue(true)
      mockUsePathname.mockReturnValue('/home')
      const { container: selectorContainer } = render(<Topbar />)
      expect(selectorContainer.querySelector('header')?.outerHTML).toMatch(/basis-full/)
    })

    it('renders the account info slot next to the wallet section', () => {
      mockIsSpaceRoute.mockReturnValue(false)
      mockUsePathname.mockReturnValue('/welcome/accounts')
      render(<Topbar />)
      expect(screen.getByTestId('header-account-info')).toBeInTheDocument()
    })
  })

  // jsdom loads no CSS, so these check which layout branch the left slot took, not the resulting
  // geometry: the logo variant must not inherit the wrapping the wide variants need, or it drops
  // onto a second row below the actions and (below md) right-aligns there. Real widths were
  // measured in a browser; see the Playwright gap noted in the PR.
  describe('single-row layout on logo routes', () => {
    const groups = (container: HTMLElement) => {
      const header = container.querySelector('header')
      if (!header) throw new Error('header not found')
      const [context, actions] = [...header.children].slice(-2)
      return { header, context, actions }
    }

    const LOGO_ROUTES = [['/welcome/accounts'], ['/welcome/spaces'], ['/settings/appearance']]

    it.each(LOGO_ROUTES)('keeps the logo and the actions on one row on %s', (pathname) => {
      mockIsSpaceRoute.mockReturnValue(false)
      mockUsePathname.mockReturnValue(pathname)

      const { context, actions } = groups(render(<Topbar />).container)

      expect(context).toContainElement(screen.getByTestId('logo-image'))
      // The logo opts out of both variants' thresholds — it always fits beside the actions.
      expect(context.className).not.toMatch(/basis-full/)
      expect(actions.className).not.toMatch(/order-first/)
      // Nothing left to push the actions off the right edge.
      expect(actions.className).toContain('ml-auto')
    })

    it.each(LOGO_ROUTES)('centers the short logo row against the actions card on %s', (pathname) => {
      mockIsSpaceRoute.mockReturnValue(false)
      mockUsePathname.mockReturnValue(pathname)

      const { header } = groups(render(<Topbar />).container)

      expect(header.className).toMatch(/items-center/)
      expect(header.className).not.toMatch(/items-start/)
    })

    it('uses the wider safe-bar threshold for the safe-selector variant', () => {
      mockIsSpaceRoute.mockReturnValue(false)
      mockUsePathname.mockReturnValue('/home')

      const { header, context, actions } = groups(render(<Topbar />).container)

      expect(context).toContainElement(screen.getByTestId('space-safe-bar'))
      expect(context.className).toContain(SAFE_BAR_CONTEXT_WRAP)
      expect(actions.className).toContain(SAFE_BAR_ACTIONS_WRAP)
      expect(header.className).toMatch(/items-start/)
      // A floor, not a fixed height: the bar wraps internally at narrow widths, and against a fixed
      // h-14 the slot's items-center centred the overflow — half of it spilling up into the actions.
      expect(context.className).toContain(SAFE_BAR_CONTEXT_HEIGHT)
      expect(context.className).not.toMatch(/(?:^|\s)h-14(?:\s|$)/)
    })

    // The search input is ~335px narrower than the safe bar, so sharing the safe bar's threshold
    // stranded it on its own row while ~600px of the header was still empty.
    it('uses the narrower search threshold for the global-search variant', () => {
      mockIsSpaceRoute.mockReturnValue(true)
      mockUsePathname.mockReturnValue('/spaces')

      const { context, actions } = groups(render(<Topbar />).container)

      // The search variant is the one the safe bar is NOT in (GlobalSearchInput is stubbed to null
      // by the feature mock, so there is no element of its own to assert on).
      expect(screen.queryByTestId('space-safe-bar')).not.toBeInTheDocument()
      expect(context.className).toContain(SEARCH_CONTEXT_WRAP)
      expect(actions.className).toContain(SEARCH_ACTIONS_WRAP)
      expect(context.className).not.toContain(SAFE_BAR_CONTEXT_WRAP)
      // This variant keeps the FIXED height: the search input sizes itself with `h-full`, which
      // needs a definite parent — a min-height would leave it collapsed to its content.
      expect(context.className).toContain(SEARCH_CONTEXT_HEIGHT)
      expect(context.className).not.toContain(SAFE_BAR_CONTEXT_HEIGHT)
    })

    // The three below pin the *shape* of the wrap rules, not just that the named constants are
    // applied — asserting the constants alone passed while all three of these were broken.
    it('does not give the actions card a full-basis, which would stretch it across the wrapped row', () => {
      mockIsSpaceRoute.mockReturnValue(false)
      mockUsePathname.mockReturnValue('/home')

      const { context, actions } = groups(render(<Topbar />).container)

      // The context slot's basis-full already consumes the line and pushes the actions below it.
      expect(context.className).toContain('basis-full')
      // Repeating it on the actions set the painted card's *width* to the whole row, leaving its
      // chips at the left of a wide empty white area.
      expect(actions.className).not.toContain('basis-full')
    })

    it('stacks the account card above the context with both rows on the left edge', () => {
      mockIsSpaceRoute.mockReturnValue(false)
      mockUsePathname.mockReturnValue('/home')

      const { context, actions } = groups(render(<Topbar />).container)

      // The context is what moves, not the actions — reordering from the actions' side put them
      // ahead of the burger and pushed it onto a row of its own.
      expect(context.className).toMatch(/order-last/)
      expect(actions.className).not.toMatch(/order-first/)
      // `ml-0` drops the `ml-auto` that right-aligns the card while the two share a row, so both
      // wrapped rows start on the page's left padding.
      expect(actions.className).toMatch(/ml-0/)
      // And the search is not right-aligned inside its full-width slot, which would put the two
      // rows on a diagonal.
      expect(context.className).not.toMatch(/justify-end/)
    })

    it('leaves the sidebar burger first in the header so it holds the top row', () => {
      mockIsSpaceRoute.mockReturnValue(false)
      mockUsePathname.mockReturnValue('/home')
      mockUseIsBelowMd.mockReturnValue(true)

      const { header, context } = groups(render(<Topbar onMenuToggle={jest.fn()} />).container)
      const burger = screen.getByRole('button', { name: 'Open sidebar menu' })

      // First child and carrying no order class of its own, so nothing can push it below the fold:
      // the context reorders around it. Inside the context slot it travelled down with it instead.
      expect(header.firstElementChild).toBe(burger)
      expect(context).not.toContainElement(burger)
      // Anchored to a class boundary — an unanchored /order-/ also matches `border-*`.
      expect(burger.className).not.toMatch(/(?:^|\s)(?:@\S+:)?order-/)
    })
  })

  describe('search button visibility', () => {
    it('shows the search button on non-space, non-welcome routes', () => {
      mockIsSpaceRoute.mockReturnValue(false)
      mockUsePathname.mockReturnValue('/home')
      render(<Topbar />)
      expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument()
    })

    it('hides the search button on /welcome/accounts', () => {
      mockIsSpaceRoute.mockReturnValue(false)
      mockUsePathname.mockReturnValue('/welcome/accounts')
      render(<Topbar />)
      expect(screen.queryByRole('button', { name: /search/i })).not.toBeInTheDocument()
    })

    it('hides the search button on /welcome/spaces', () => {
      mockIsSpaceRoute.mockReturnValue(false)
      mockUsePathname.mockReturnValue('/welcome/spaces')
      render(<Topbar />)
      expect(screen.queryByRole('button', { name: /search/i })).not.toBeInTheDocument()
    })

    it('shows the search button on other welcome subpaths', () => {
      mockIsSpaceRoute.mockReturnValue(false)
      mockUsePathname.mockReturnValue('/welcome')
      render(<Topbar />)
      expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument()
    })
  })

  describe('wallet tracking', () => {
    beforeEach(() => {
      mockUseCurrentSpaceId.mockReturnValue('space-42')
      mockUseLoadFeature.mockReturnValue({
        WalletPopover: ({
          onWalletSwitch,
          onWalletDisconnect,
        }: {
          onWalletSwitch?: () => void
          onWalletDisconnect?: () => void
        }) => (
          <>
            <button onClick={onWalletSwitch}>trigger-switch</button>
            <button onClick={onWalletDisconnect}>trigger-disconnect</button>
          </>
        ),
        GlobalSearchModal: () => null,
        GlobalSearchInput: () => null,
        WalletConnectWidget: () => null,
      })
    })

    it('fires WALLET_SWITCHED with spaceId as GA label and Mixpanel param', () => {
      render(<Topbar />)
      screen.getByText('trigger-switch').click()

      expect(trackEvent).toHaveBeenCalledWith(
        { ...SPACE_EVENTS.WALLET_SWITCHED, label: 'space-42' },
        { spaceId: 'space-42' },
      )
    })

    it('fires WALLET_DISCONNECTED with spaceId as GA label and Mixpanel param', () => {
      render(<Topbar />)
      screen.getByText('trigger-disconnect').click()

      expect(trackEvent).toHaveBeenCalledWith(
        { ...SPACE_EVENTS.WALLET_DISCONNECTED, label: 'space-42' },
        { spaceId: 'space-42' },
      )
    })

    it('fires WALLET_SWITCHED exactly once per click', () => {
      render(<Topbar />)
      screen.getByText('trigger-switch').click()

      expect(trackEvent).toHaveBeenCalledTimes(1)
    })

    it('fires WALLET_DISCONNECTED exactly once per click', () => {
      render(<Topbar />)
      screen.getByText('trigger-disconnect').click()

      expect(trackEvent).toHaveBeenCalledTimes(1)
    })

    it('does not fire when spaceId is null (outside Spaces)', () => {
      mockUseCurrentSpaceId.mockReturnValue(null)
      render(<Topbar />)
      screen.getByText('trigger-switch').click()
      screen.getByText('trigger-disconnect').click()

      expect(trackEvent).not.toHaveBeenCalled()
    })
  })

  describe('mobile', () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue(true)
      mockUseIsBelowMd.mockReturnValue(true)
    })

    afterEach(() => {
      mockUseIsBelowMd.mockReturnValue(false)
    })

    it('shows the sidebar menu button when on mobile and onMenuToggle is provided', () => {
      const onMenuToggle = jest.fn()
      render(<Topbar onMenuToggle={onMenuToggle} />)
      expect(screen.getByRole('button', { name: /open sidebar menu/i })).toBeInTheDocument()
    })

    it('calls onMenuToggle with a toggle function when the menu button is clicked', async () => {
      const user = userEvent.setup()
      const onMenuToggle = jest.fn()
      render(<Topbar onMenuToggle={onMenuToggle} />)

      await user.click(screen.getByRole('button', { name: /open sidebar menu/i }))

      expect(onMenuToggle).toHaveBeenCalledTimes(1)
      const setStateArg = onMenuToggle.mock.calls[0][0] as (prev: boolean) => boolean
      expect(typeof setStateArg).toBe('function')
      expect(setStateArg(false)).toBe(true)
      expect(setStateArg(true)).toBe(false)
    })
  })
})
