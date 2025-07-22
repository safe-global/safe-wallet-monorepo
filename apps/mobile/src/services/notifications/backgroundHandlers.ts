import { getMessaging } from '@react-native-firebase/messaging'
import notifee from '@notifee/react-native'

/**
 * The background handlers here are only used by the Android version of the app.
 * On iOS, the Notification Service Extension is intercepting the notifications and those
 * functions here never get called.
 */
getMessaging().setBackgroundMessageHandler(async (remoteMessage) => {
  const messageId = remoteMessage.messageId || `${remoteMessage.data?.type}-${Date.now()}`
  console.log('[Firebase Background] Processing message:', messageId)

  try {
    // Check for message deduplication and mark as processed
    const { checkAndMarkMessageProcessed } = await import('@/src/services/notifications/utils/messageDeduplication')

    if (checkAndMarkMessageProcessed(messageId)) {
      console.log('[Firebase Background] Message already processed, acknowledging:', messageId)
      return // Already processed - acknowledge and skip
    }

    console.log('[Firebase Background] Displaying notification for message:', messageId)

    // Use regular parser with automatic fallback to extension MMKV storage
    const { parseNotification } = await import('./notificationParser')
    const NotificationsService = (await import('./NotificationService')).default
    const { ChannelId } = await import('@/src/utils/notifications')

    const parsed = parseNotification(remoteMessage.data)

    // Add timeout to prevent hanging
    await NotificationsService.displayNotification({
      channelId: ChannelId.DEFAULT_NOTIFICATION_CHANNEL_ID,
      title: parsed?.title || remoteMessage.notification?.title || '',
      body: parsed?.body || remoteMessage.notification?.body || '',
      data: remoteMessage.data,
    })

    console.log('[Firebase Background] Successfully processed message:', messageId)
  } catch (error) {
    console.error('[Firebase Background] Error processing message:', messageId, error)
  }

  return Promise.resolve()
})

notifee.onBackgroundEvent(async ({ type, detail }) => {
  console.log('[Notifee Background] Event received:', type)

  try {
    // Delegate to NotificationService for consistent logic
    const NotificationsService = (await import('./NotificationService')).default
    await NotificationsService.handleNotificationEvent({ type, detail })

    console.log('[Notifee Background] Event processed successfully')
  } catch (error) {
    console.error('[Notifee Background] Error processing event:', error)
  }
})
