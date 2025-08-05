/**
 * Unit tests for useNotificationHandler hook
 */
import { renderHook } from '@testing-library/react-native'
import { EventType, EventDetail } from '@notifee/react-native'
import { useNotificationHandler } from '../useNotificationHandler'
import NotificationsService from '@/src/services/notifications/NotificationService'
import Logger from '@/src/utils/logger'

// Define types for test events
interface TestNotificationEvent {
  type: EventType
  detail: EventDetail | undefined
}

// Mock dependencies
jest.mock('@/src/services/notifications/NotificationService', () => ({
  onForegroundEvent: jest.fn(),
  handleNotificationPress: jest.fn(),
  incrementBadgeCount: jest.fn(),
}))

jest.mock('@/src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}))

// Mock Notifee EventType
jest.mock('@notifee/react-native', () => ({
  EventType: {
    PRESS: 'press',
    DELIVERED: 'delivered',
    DISMISSED: 'dismissed',
  },
}))

const mockNotificationsService = jest.mocked(NotificationsService)
const mockLogger = jest.mocked(Logger)

describe('useNotificationHandler', () => {
  const mockUnsubscribe = jest.fn()
  let mockEventHandler: ((event: TestNotificationEvent) => Promise<void>) | undefined

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock onForegroundEvent to capture the event handler
    mockNotificationsService.onForegroundEvent.mockImplementation((handler) => {
      mockEventHandler = handler as (event: TestNotificationEvent) => Promise<void>
      return mockUnsubscribe
    })

    mockNotificationsService.handleNotificationPress.mockResolvedValue()
    mockNotificationsService.incrementBadgeCount.mockResolvedValue()
  })

  describe('hook initialization', () => {
    it('should set up foreground event listener on mount', () => {
      renderHook(() => useNotificationHandler())

      expect(mockNotificationsService.onForegroundEvent).toHaveBeenCalledWith(expect.any(Function))
      expect(mockNotificationsService.onForegroundEvent).toHaveBeenCalledTimes(1)
    })

    it('should return cleanup function that calls unsubscribe', () => {
      const { unmount } = renderHook(() => useNotificationHandler())

      unmount()

      expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
    })
  })

  describe('event handling', () => {
    it('should handle PRESS event correctly', async () => {
      renderHook(() => useNotificationHandler())

      const mockEvent: TestNotificationEvent = {
        type: EventType.PRESS,
        detail: {
          notification: {
            id: 'test-notification-id',
            data: { key: 'value' },
          },
        },
      }

      await mockEventHandler?.(mockEvent)

      expect(mockNotificationsService.handleNotificationPress).toHaveBeenCalledWith({
        detail: mockEvent.detail,
      })
      expect(mockNotificationsService.handleNotificationPress).toHaveBeenCalledTimes(1)
    })

    it('should handle DELIVERED event correctly', async () => {
      renderHook(() => useNotificationHandler())

      const mockEvent: TestNotificationEvent = {
        type: EventType.DELIVERED,
        detail: {
          notification: {
            id: 'test-notification-id',
          },
        },
      }

      await mockEventHandler?.(mockEvent)

      expect(mockNotificationsService.incrementBadgeCount).toHaveBeenCalledWith(1)
      expect(mockNotificationsService.incrementBadgeCount).toHaveBeenCalledTimes(1)
    })

    it('should handle DISMISSED event correctly', async () => {
      renderHook(() => useNotificationHandler())

      const mockEvent: TestNotificationEvent = {
        type: EventType.DISMISSED,
        detail: {
          notification: {
            id: 'test-notification-id',
          },
        },
      }

      await mockEventHandler?.(mockEvent)

      expect(mockLogger.info).toHaveBeenCalledWith('User dismissed notification:', 'test-notification-id')
      expect(mockLogger.info).toHaveBeenCalledTimes(1)
    })

    it('should handle DISMISSED event with missing notification id', async () => {
      renderHook(() => useNotificationHandler())

      const mockEvent: TestNotificationEvent = {
        type: EventType.DISMISSED,
        detail: {
          notification: undefined,
        },
      }

      await mockEventHandler?.(mockEvent)

      expect(mockLogger.info).toHaveBeenCalledWith('User dismissed notification:', undefined)
      expect(mockLogger.info).toHaveBeenCalledTimes(1)
    })

    it('should handle unknown event types gracefully', async () => {
      renderHook(() => useNotificationHandler())

      const mockEvent = {
        type: 'UNKNOWN_EVENT_TYPE' as unknown as EventType,
        detail: {
          notification: {
            id: 'test-notification-id',
          },
        },
      } as TestNotificationEvent

      await mockEventHandler?.(mockEvent)

      // Should not call any notification service methods for unknown events
      expect(mockNotificationsService.handleNotificationPress).not.toHaveBeenCalled()
      expect(mockNotificationsService.incrementBadgeCount).not.toHaveBeenCalled()
      expect(mockLogger.info).not.toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should handle errors in PRESS event processing', async () => {
      renderHook(() => useNotificationHandler())

      const mockError = new Error('Press handling failed')
      mockNotificationsService.handleNotificationPress.mockRejectedValue(mockError)

      const mockEvent: TestNotificationEvent = {
        type: EventType.PRESS,
        detail: {
          notification: {
            id: 'test-notification-id',
          },
        },
      }

      await mockEventHandler?.(mockEvent)

      expect(mockLogger.error).toHaveBeenCalledWith(
        'useNotificationHandler: Error handling foreground notification event',
        mockError,
      )
      expect(mockLogger.error).toHaveBeenCalledTimes(1)
    })

    it('should handle errors in DELIVERED event processing', async () => {
      renderHook(() => useNotificationHandler())

      const mockError = new Error('Badge increment failed')
      mockNotificationsService.incrementBadgeCount.mockRejectedValue(mockError)

      const mockEvent: TestNotificationEvent = {
        type: EventType.DELIVERED,
        detail: {
          notification: {
            id: 'test-notification-id',
          },
        },
      }

      await mockEventHandler?.(mockEvent)

      expect(mockLogger.error).toHaveBeenCalledWith(
        'useNotificationHandler: Error handling foreground notification event',
        mockError,
      )
      expect(mockLogger.error).toHaveBeenCalledTimes(1)
    })

    it('should handle errors in DISMISSED event processing', async () => {
      renderHook(() => useNotificationHandler())

      // Mock Logger.info to throw an error
      mockLogger.info.mockImplementation(() => {
        throw new Error('Logging failed')
      })

      const mockEvent: TestNotificationEvent = {
        type: EventType.DISMISSED,
        detail: {
          notification: {
            id: 'test-notification-id',
          },
        },
      }

      await mockEventHandler?.(mockEvent)

      expect(mockLogger.error).toHaveBeenCalledWith(
        'useNotificationHandler: Error handling foreground notification event',
        expect.any(Error),
      )
      expect(mockLogger.error).toHaveBeenCalledTimes(1)
    })
  })

  describe('hook lifecycle', () => {
    it('should only set up event listener once', () => {
      const { rerender } = renderHook(() => useNotificationHandler())

      expect(mockNotificationsService.onForegroundEvent).toHaveBeenCalledTimes(1)

      // Rerender the hook
      rerender({})

      // Should still only be called once due to empty dependency array
      expect(mockNotificationsService.onForegroundEvent).toHaveBeenCalledTimes(1)
    })

    it('should clean up event listener on unmount', () => {
      const { unmount } = renderHook(() => useNotificationHandler())

      expect(mockUnsubscribe).not.toHaveBeenCalled()

      unmount()

      expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
    })
  })

  describe('edge cases', () => {
    it('should handle event with undefined detail', async () => {
      renderHook(() => useNotificationHandler())

      const mockEvent: TestNotificationEvent = {
        type: EventType.PRESS,
        detail: undefined,
      }

      await mockEventHandler?.(mockEvent)

      expect(mockNotificationsService.handleNotificationPress).toHaveBeenCalledWith({
        detail: undefined,
      })
    })

    it('should handle event with missing notification in detail', async () => {
      renderHook(() => useNotificationHandler())

      const mockEvent: TestNotificationEvent = {
        type: EventType.DISMISSED,
        detail: {
          notification: undefined,
        },
      }

      await mockEventHandler?.(mockEvent)

      expect(mockLogger.info).toHaveBeenCalledWith('User dismissed notification:', undefined)
    })

    it('should handle multiple rapid events', async () => {
      renderHook(() => useNotificationHandler())

      const events: TestNotificationEvent[] = [
        {
          type: EventType.DELIVERED,
          detail: { notification: { id: 'notification-1' } },
        },
        {
          type: EventType.PRESS,
          detail: { notification: { id: 'notification-2' } },
        },
        {
          type: EventType.DISMISSED,
          detail: { notification: { id: 'notification-3' } },
        },
      ]

      // Process all events
      for (const event of events) {
        await mockEventHandler?.(event)
      }

      expect(mockNotificationsService.incrementBadgeCount).toHaveBeenCalledTimes(1)
      expect(mockNotificationsService.handleNotificationPress).toHaveBeenCalledTimes(1)
      expect(mockLogger.info).toHaveBeenCalledTimes(1)
    })
  })
})
