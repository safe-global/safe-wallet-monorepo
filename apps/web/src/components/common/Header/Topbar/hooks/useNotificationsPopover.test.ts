import { renderHook, act } from '@/tests/test-utils'
import useNotificationsPopover, { NOTIFICATION_CENTER_LIMIT } from './useNotificationsPopover'
import type { Notification } from '@/store/notificationsSlice'
import type { RootState } from '@/store'

const mockUseShowNotificationsRenewalMessage = jest.fn()
jest.mock('@/components/settings/PushNotifications/hooks/useShowNotificationsRenewalMessage', () => ({
  useShowNotificationsRenewalMessage: () => mockUseShowNotificationsRenewalMessage(),
}))

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
  OVERVIEW_EVENTS: { NOTIFICATION_CENTER: 'notification_center' },
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

const stateWithNotifications = (notifications: Notification[]): Partial<RootState> => ({
  notifications,
})

describe('useNotificationsPopover', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls useShowNotificationsRenewalMessage on render', () => {
    renderHook(() => useNotificationsPopover())
    expect(mockUseShowNotificationsRenewalMessage).toHaveBeenCalled()
  })

  it('returns empty notifications by default', () => {
    const { result } = renderHook(() => useNotificationsPopover())

    expect(result.current.notifications).toEqual([])
    expect(result.current.unreadCount).toBe(0)
    expect(result.current.open).toBe(false)
    expect(result.current.canExpand).toBe(false)
  })

  it('computes unreadCount from notifications', () => {
    const initialReduxState = stateWithNotifications([
      createNotification(),
      createNotification(),
      createNotification({ isRead: true }),
    ])

    const { result } = renderHook(() => useNotificationsPopover(), { initialReduxState })

    expect(result.current.unreadCount).toBe(2)
  })

  it('sorts notifications chronologically (newest first)', () => {
    const initialReduxState = stateWithNotifications([
      createNotification({ message: 'older', timestamp: 1000 }),
      createNotification({ message: 'newer', timestamp: 2000 }),
    ])

    const { result } = renderHook(() => useNotificationsPopover(), { initialReduxState })

    expect(result.current.notificationsToShow[0].message).toBe('newer')
    expect(result.current.notificationsToShow[1].message).toBe('older')
  })

  it('limits visible notifications when canExpand is true', () => {
    const notifications = Array.from({ length: NOTIFICATION_CENTER_LIMIT + 2 }, () => createNotification())

    const initialReduxState = stateWithNotifications(notifications)

    const { result } = renderHook(() => useNotificationsPopover(), { initialReduxState })

    expect(result.current.canExpand).toBe(true)
    expect(result.current.notificationsToShow).toHaveLength(NOTIFICATION_CENTER_LIMIT)
  })

  it('clears all notifications on handleClear', () => {
    const initialReduxState = stateWithNotifications([createNotification()])

    const { result } = renderHook(() => useNotificationsPopover(), { initialReduxState })

    expect(result.current.notifications).toHaveLength(1)

    act(() => {
      result.current.handleClear()
    })

    expect(result.current.notifications).toHaveLength(0)
  })
})
