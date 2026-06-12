import Topbar from './index'
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
