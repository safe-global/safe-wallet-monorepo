import Topbar from './index'
import * as contracts from '@/features/__core__'
import { render, screen } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import type { Notification } from '@/store/notificationsSlice'
import type { RootState } from '@/store'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'

jest.mock('@/features/__core__', () => ({
  ...jest.requireActual('@/features/__core__'),
  useLoadFeature: jest.fn(),
}))

const mockWallet = { address: '0x1234567890abcdef1234567890abcdef12345678', balance: '0' }

const mockUseIsMobile = jest.fn(() => false)
jest.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => mockUseIsMobile(),
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

jest.mock('@/components/settings/PushNotifications/hooks/useShowNotificationsRenewalMessage', () => ({
  useShowNotificationsRenewalMessage: jest.fn(),
}))

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
  OVERVIEW_EVENTS: { NOTIFICATION_CENTER: 'notification_center' },
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
    mockUseLoadFeature.mockReturnValue({
      WalletPopover: () => null,
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
