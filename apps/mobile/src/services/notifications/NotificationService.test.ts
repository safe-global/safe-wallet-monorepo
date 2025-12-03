import { AuthorizationStatus, EventType } from '@notifee/react-native'
import { ChannelId } from '@/src/utils/notifications'

jest.mock('./notificationParser', () => ({
  parseNotification: jest.fn(() => ({ title: 'Test Title', body: 'Test Body' })),
}))

jest.mock('./notificationNavigationHandler', () => ({
  NotificationNavigationHandler: {
    handleNotificationPress: jest.fn(() => Promise.resolve()),
  },
}))

jest.mock('./BadgeManager', () => ({
  __esModule: true,
  default: {
    incrementBadgeCount: jest.fn(),
  },
}))

jest.mock('@/src/store/utils/singletonStore', () => ({
  getStore: jest.fn(() => ({
    dispatch: jest.fn(),
  })),
}))

import notifee from '@notifee/react-native'
import NotificationsService from './NotificationService'

describe('NotificationsService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getBlockedNotifications', () => {
    it('returns blocked channels when permission is denied', async () => {
      ;(notifee.getNotificationSettings as jest.Mock).mockResolvedValue({
        authorizationStatus: AuthorizationStatus.DENIED,
      })
      ;(notifee.getChannels as jest.Mock).mockResolvedValue([])

      const result = await NotificationsService.getBlockedNotifications()

      expect(result.size).toBeGreaterThan(0)
    })

    it('returns blocked channels when status is NOT_DETERMINED', async () => {
      ;(notifee.getNotificationSettings as jest.Mock).mockResolvedValue({
        authorizationStatus: AuthorizationStatus.NOT_DETERMINED,
      })
      ;(notifee.getChannels as jest.Mock).mockResolvedValue([])

      const result = await NotificationsService.getBlockedNotifications()

      expect(result.size).toBeGreaterThan(0)
    })

    it('returns blocked channels from channel list when authorized', async () => {
      ;(notifee.getNotificationSettings as jest.Mock).mockResolvedValue({
        authorizationStatus: AuthorizationStatus.AUTHORIZED,
      })
      ;(notifee.getChannels as jest.Mock).mockResolvedValue([
        { id: 'DEFAULT_NOTIFICATION_CHANNEL_ID', blocked: true },
        { id: 'ANNOUNCEMENT_NOTIFICATION_CHANNEL_ID', blocked: false },
      ])

      const result = await NotificationsService.getBlockedNotifications()

      expect(result.get('DEFAULT_NOTIFICATION_CHANNEL_ID' as ChannelId)).toBe(true)
      expect(result.has('ANNOUNCEMENT_NOTIFICATION_CHANNEL_ID' as ChannelId)).toBe(false)
    })

    it('returns empty map on error', async () => {
      ;(notifee.getNotificationSettings as jest.Mock).mockRejectedValue(new Error('Test error'))

      const result = await NotificationsService.getBlockedNotifications()

      expect(result.size).toBe(0)
    })
  })

  describe('enableNotifications', () => {
    it('dispatches actions to enable notifications', () => {
      const { getStore } = jest.requireMock('@/src/store/utils/singletonStore')
      const mockDispatch = jest.fn()
      getStore.mockReturnValue({ dispatch: mockDispatch })

      NotificationsService.enableNotifications()

      expect(mockDispatch).toHaveBeenCalledTimes(4)
    })
  })

  describe('getAllPermissions', () => {
    it('returns permission and blocked notifications when authorized', async () => {
      ;(notifee.createChannel as jest.Mock).mockResolvedValue('channel-id')
      ;(notifee.requestPermission as jest.Mock).mockResolvedValue({
        authorizationStatus: AuthorizationStatus.AUTHORIZED,
      })
      ;(notifee.getNotificationSettings as jest.Mock).mockResolvedValue({
        authorizationStatus: AuthorizationStatus.AUTHORIZED,
      })
      ;(notifee.getChannels as jest.Mock).mockResolvedValue([])

      const result = await NotificationsService.getAllPermissions()

      expect(result.permission).toBe('granted')
      expect(result.blockedNotifications).toBeInstanceOf(Map)
    })

    it('returns denied permission when authorization is denied', async () => {
      ;(notifee.createChannel as jest.Mock).mockResolvedValue('channel-id')
      ;(notifee.requestPermission as jest.Mock).mockResolvedValue({ authorizationStatus: AuthorizationStatus.DENIED })
      ;(notifee.getNotificationSettings as jest.Mock).mockResolvedValue({
        authorizationStatus: AuthorizationStatus.DENIED,
      })
      ;(notifee.getChannels as jest.Mock).mockResolvedValue([])

      const result = await NotificationsService.getAllPermissions(false)

      expect(result.permission).toBe('denied')
    })

    it('returns denied on error', async () => {
      ;(notifee.createChannel as jest.Mock).mockRejectedValue(new Error('Channel error'))
      ;(notifee.requestPermission as jest.Mock).mockRejectedValue(new Error('Permission error'))
      ;(notifee.getNotificationSettings as jest.Mock).mockRejectedValue(new Error('Settings error'))

      const result = await NotificationsService.getAllPermissions()

      expect(result.permission).toBe('denied')
    })
  })

  describe('isDeviceNotificationEnabled', () => {
    it('returns true when authorized', async () => {
      ;(notifee.getNotificationSettings as jest.Mock).mockResolvedValue({
        authorizationStatus: AuthorizationStatus.AUTHORIZED,
      })

      const result = await NotificationsService.isDeviceNotificationEnabled()

      expect(result).toBe(true)
    })

    it('returns true when provisional', async () => {
      ;(notifee.getNotificationSettings as jest.Mock).mockResolvedValue({
        authorizationStatus: AuthorizationStatus.PROVISIONAL,
      })

      const result = await NotificationsService.isDeviceNotificationEnabled()

      expect(result).toBe(true)
    })

    it('returns false when denied', async () => {
      ;(notifee.getNotificationSettings as jest.Mock).mockResolvedValue({
        authorizationStatus: AuthorizationStatus.DENIED,
      })

      const result = await NotificationsService.isDeviceNotificationEnabled()

      expect(result).toBe(false)
    })
  })

  describe('getAuthorizationStatus', () => {
    it('returns the authorization status', async () => {
      ;(notifee.getNotificationSettings as jest.Mock).mockResolvedValue({
        authorizationStatus: AuthorizationStatus.AUTHORIZED,
      })

      const result = await NotificationsService.getAuthorizationStatus()

      expect(result).toBe(AuthorizationStatus.AUTHORIZED)
    })
  })

  describe('isAuthorizationDenied', () => {
    it('returns true when denied', async () => {
      ;(notifee.getNotificationSettings as jest.Mock).mockResolvedValue({
        authorizationStatus: AuthorizationStatus.DENIED,
      })

      const result = await NotificationsService.isAuthorizationDenied()

      expect(result).toBe(true)
    })

    it('returns false when authorized', async () => {
      ;(notifee.getNotificationSettings as jest.Mock).mockResolvedValue({
        authorizationStatus: AuthorizationStatus.AUTHORIZED,
      })

      const result = await NotificationsService.isAuthorizationDenied()

      expect(result).toBe(false)
    })
  })

  describe('checkCurrentPermissions', () => {
    it('returns granted when authorized', async () => {
      ;(notifee.getNotificationSettings as jest.Mock).mockResolvedValue({
        authorizationStatus: AuthorizationStatus.AUTHORIZED,
      })

      const result = await NotificationsService.checkCurrentPermissions()

      expect(result).toBe('granted')
    })

    it('returns granted when provisional', async () => {
      ;(notifee.getNotificationSettings as jest.Mock).mockResolvedValue({
        authorizationStatus: AuthorizationStatus.PROVISIONAL,
      })

      const result = await NotificationsService.checkCurrentPermissions()

      expect(result).toBe('granted')
    })

    it('returns denied when not authorized', async () => {
      ;(notifee.getNotificationSettings as jest.Mock).mockResolvedValue({
        authorizationStatus: AuthorizationStatus.DENIED,
      })

      const result = await NotificationsService.checkCurrentPermissions()

      expect(result).toBe('denied')
    })
  })

  describe('onForegroundEvent', () => {
    it('registers foreground event observer', () => {
      const observer = jest.fn()

      NotificationsService.onForegroundEvent(observer)

      expect(notifee.onForegroundEvent).toHaveBeenCalledWith(observer)
    })
  })

  describe('onBackgroundEvent', () => {
    it('registers background event observer', () => {
      const observer = jest.fn()

      NotificationsService.onBackgroundEvent(observer)

      expect(notifee.onBackgroundEvent).toHaveBeenCalledWith(observer)
    })
  })

  describe('handleNotificationEvent', () => {
    it('increments badge count on DELIVERED event', async () => {
      const BadgeManager = jest.requireMock('./BadgeManager').default

      await NotificationsService.handleNotificationEvent({
        type: EventType.DELIVERED,
        detail: {},
      })

      expect(BadgeManager.incrementBadgeCount).toHaveBeenCalledWith(1)
    })

    it('handles notification press on PRESS event with data', async () => {
      const { NotificationNavigationHandler } = jest.requireMock('./notificationNavigationHandler')
      ;(notifee.cancelTriggerNotification as jest.Mock).mockResolvedValue(undefined)

      await NotificationsService.handleNotificationPress({
        detail: {
          notification: {
            id: 'test-id',
            data: { type: 'test' },
          },
        },
      })

      expect(notifee.cancelTriggerNotification).toHaveBeenCalledWith('test-id')
      expect(NotificationNavigationHandler.handleNotificationPress).toHaveBeenCalled()
    })
  })

  describe('cancelTriggerNotification', () => {
    it('cancels notification with id', async () => {
      ;(notifee.cancelTriggerNotification as jest.Mock).mockResolvedValue(undefined)

      await NotificationsService.cancelTriggerNotification('test-id')

      expect(notifee.cancelTriggerNotification).toHaveBeenCalledWith('test-id')
    })

    it('does nothing when id is undefined', async () => {
      await NotificationsService.cancelTriggerNotification(undefined)

      expect(notifee.cancelTriggerNotification).not.toHaveBeenCalled()
    })
  })

  describe('getInitialNotification', () => {
    it('calls callback with notification data when present', async () => {
      const callback = jest.fn()
      ;(notifee.getInitialNotification as jest.Mock).mockResolvedValue({
        notification: { data: { type: 'test' } },
      })

      await NotificationsService.getInitialNotification(callback)

      expect(callback).toHaveBeenCalledWith({ type: 'test' })
    })

    it('does not call callback when no initial notification', async () => {
      const callback = jest.fn()
      ;(notifee.getInitialNotification as jest.Mock).mockResolvedValue(null)

      await NotificationsService.getInitialNotification(callback)

      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('cancelAllNotifications', () => {
    it('cancels all notifications', async () => {
      ;(notifee.cancelAllNotifications as jest.Mock).mockResolvedValue(undefined)

      await NotificationsService.cancelAllNotifications()

      expect(notifee.cancelAllNotifications).toHaveBeenCalled()
    })
  })

  describe('createChannel', () => {
    it('creates notification channel', async () => {
      ;(notifee.createChannel as jest.Mock).mockResolvedValue('channel-id')

      const result = await NotificationsService.createChannel({
        id: 'test',
        name: 'Test Channel',
      })

      expect(result).toBe('channel-id')
      expect(notifee.createChannel).toHaveBeenCalledWith({
        id: 'test',
        name: 'Test Channel',
      })
    })
  })

  describe('displayNotification', () => {
    it('displays notification with provided params', async () => {
      ;(notifee.displayNotification as jest.Mock).mockResolvedValue('notification-id')

      await NotificationsService.displayNotification({
        channelId: 'default' as never,
        title: 'Test Title',
        body: 'Test Body',
        data: { key: 'value' },
      })

      expect(notifee.displayNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Title',
          body: 'Test Body',
          data: { key: 'value' },
        }),
      )
    })

    it('handles display error gracefully', async () => {
      ;(notifee.displayNotification as jest.Mock).mockRejectedValue(new Error('Display error'))

      await expect(
        NotificationsService.displayNotification({
          channelId: 'default' as never,
          title: 'Test',
        }),
      ).resolves.not.toThrow()
    })
  })
})
