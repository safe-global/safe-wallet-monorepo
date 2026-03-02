import Topbar from './index'
import * as contracts from '@/features/__core__'
import { render, screen } from '@/tests/test-utils'
import type { Notification } from '@/store/notificationsSlice'
import type { RootState } from '@/store'
import { useIsSpaceRoute } from '@/hooks/useIsSpaceRoute'

jest.mock('@/hooks/useIsSpaceRoute', () => ({
  useIsSpaceRoute: jest.fn(() => false),
}))

jest.mock('./hooks/useTopbarSafeData', () => ({
  useTopbarSafeData: jest.fn(() => ({
    items: [],
    selectedItemId: undefined,
    handleItemSelect: jest.fn(),
    handleChainChange: jest.fn(),
  })),
}))

jest.mock('@/features/__core__', () => ({
  ...jest.requireActual('@/features/__core__'),
  useLoadFeature: jest.fn(),
}))

const mockWallet = { address: '0x1234567890abcdef1234567890abcdef12345678', balance: '0' }

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

  it('does not render SafeSelectorDropdown in space view', () => {
    ;(useIsSpaceRoute as jest.Mock).mockReturnValue(true)

    render(<Topbar />)

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('renders SafeTopbarContent in safe view', () => {
    ;(useIsSpaceRoute as jest.Mock).mockReturnValue(false)

    render(<Topbar />)

    // SafeTopbarContent is rendered (returns null when items is empty, which is our mock)
    // Just verify we don't crash and the header navigation still renders
    expect(screen.getByText('0x1234...5678')).toBeInTheDocument()
  })
})
