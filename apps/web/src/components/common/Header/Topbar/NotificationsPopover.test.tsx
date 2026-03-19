import { useRef } from 'react'
import { render, screen, fireEvent } from '@/tests/test-utils'
import NotificationsPopover, { type NotificationsPopoverRef } from './NotificationsPopover'
import type { Notification } from '@/store/notificationsSlice'
import type { RootState } from '@/store'

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

jest.mock('@/hooks/useChains', () => ({
  useHasFeature: jest.fn().mockReturnValue(false),
}))

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

// Wrapper that opens the popover via the imperative ref
function PopoverOpener() {
  const ref = useRef<NotificationsPopoverRef>(null)

  return (
    <>
      <button data-testid="open-trigger" onClick={(e) => ref.current?.handleClick(e as any)} />
      <NotificationsPopover ref={ref} />
    </>
  )
}

describe('NotificationsPopover', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders data-testid="notifications-title" when open', () => {
    const initialReduxState: Partial<RootState> = {
      notifications: [createNotification()],
    }

    render(<PopoverOpener />, { initialReduxState })
    fireEvent.click(screen.getByTestId('open-trigger'))

    expect(screen.getByTestId('notifications-title')).toBeInTheDocument()
    expect(screen.getByTestId('notifications-title')).toHaveTextContent('Notifications')
  })

  it('renders "Clear all" when there are notifications', () => {
    const initialReduxState: Partial<RootState> = {
      notifications: [createNotification()],
    }

    render(<PopoverOpener />, { initialReduxState })
    fireEvent.click(screen.getByTestId('open-trigger'))

    expect(screen.getByText('Clear all')).toBeInTheDocument()
  })

  it('does not render "Clear all" when there are no notifications', () => {
    render(<PopoverOpener />)
    fireEvent.click(screen.getByTestId('open-trigger'))

    expect(screen.queryByText('Clear all')).not.toBeInTheDocument()
  })

  it('renders data-testid="notifications-button" when push notifications feature is enabled', () => {
    const { useHasFeature } = require('@/hooks/useChains')
    useHasFeature.mockReturnValue(true)

    render(<PopoverOpener />)
    fireEvent.click(screen.getByTestId('open-trigger'))

    expect(screen.getByTestId('notifications-button')).toBeInTheDocument()
    expect(screen.getByTestId('notifications-button')).toHaveTextContent('Push notifications settings')
  })

  it('does not render push notifications settings when feature is disabled', () => {
    const { useHasFeature } = require('@/hooks/useChains')
    useHasFeature.mockReturnValue(false)

    render(<PopoverOpener />)
    fireEvent.click(screen.getByTestId('open-trigger'))

    expect(screen.queryByTestId('notifications-button')).not.toBeInTheDocument()
  })

  it('shows unread count when there are unread notifications', () => {
    const initialReduxState: Partial<RootState> = {
      notifications: [createNotification(), createNotification()],
    }

    render(<PopoverOpener />, { initialReduxState })
    fireEvent.click(screen.getByTestId('open-trigger'))

    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('does not show unread count when all notifications are read', () => {
    const initialReduxState: Partial<RootState> = {
      notifications: [createNotification({ isRead: true })],
    }

    render(<PopoverOpener />, { initialReduxState })
    fireEvent.click(screen.getByTestId('open-trigger'))

    expect(screen.queryByText('1')).not.toBeInTheDocument()
  })
})
