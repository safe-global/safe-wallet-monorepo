import { useEffect } from 'react'
import { EventType } from '@notifee/react-native'
import NotificationsService from '@/src/services/notifications/NotificationService'
import Logger from '@/src/utils/logger'

/**
 * Hook to handle notification events when the app is in the foreground
 */
export const useNotificationHandler = () => {
  useEffect(() => {
    // Set up foreground event listener
    const unsubscribe = NotificationsService.onForegroundEvent(async ({ type, detail }) => {
      try {
        if (type === EventType.PRESS) {
          await NotificationsService.handleNotificationPress({ detail })
        } else if (type === EventType.DELIVERED) {
          await NotificationsService.incrementBadgeCount(1)
        } else if (type === EventType.DISMISSED) {
          Logger.info('User dismissed notification:', detail.notification?.id)
        }
      } catch (error) {
        Logger.error('useNotificationHandler: Error handling foreground notification event', error)
      }
    })

    // Cleanup
    return () => {
      unsubscribe()
    }
  }, [])
}
