import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging'
import Logger from '@/src/utils/logger'
import NotificationsService from './NotificationService'
import { ChannelId } from '@/src/utils/notifications'
import { store } from '@/src/store'
import { savePushToken } from '@/src/store/notificationsSlice'

type UnsubscribeFunc = () => void

class FCMService {
  async getFCMToken(): Promise<string | undefined> {
    const { fcmToken } = store.getState().notifications
    const token = fcmToken || undefined
    if (!token) {
      Logger.info('getFCMToken: No FCM token found')
    }
    return token
  }

  async saveFCMToken(): Promise<void> {
    try {
      const fcmToken = await messaging().getToken()
      if (fcmToken) {
        store.dispatch(savePushToken(fcmToken))
      }
    } catch (error) {
      Logger.info('FCMService :: error saving', error)
    }
  }

  listenForMessagesForeground = (): UnsubscribeFunc =>
    messaging().onMessage(async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
      NotificationsService.displayNotification({
        channelId: ChannelId.DEFAULT_NOTIFICATION_CHANNEL_ID,
        title: remoteMessage.notification?.title || '',
        body: remoteMessage.notification?.body || '',
        data: remoteMessage.data,
      })
      Logger.trace('listenForMessagesForeground: listening for messages in Foreground', remoteMessage)
    })

  listenForMessagesBackground = (): void => {
    messaging().setBackgroundMessageHandler(async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
      NotificationsService.displayNotification({
        channelId: ChannelId.DEFAULT_NOTIFICATION_CHANNEL_ID,
        title: remoteMessage.notification?.title || '',
        body: remoteMessage.notification?.body || '',
        data: remoteMessage.data,
      })
      Logger.trace('listenForMessagesBackground :: listening for messages in background', remoteMessage)
    })
  }

  async registerAppWithFCM(): Promise<void> {
    if (!messaging().registerDeviceForRemoteMessages) {
      await messaging()
        .registerDeviceForRemoteMessages()
        .then((status: unknown) => {
          Logger.info('registerDeviceForRemoteMessages status', status)
        })
        .catch((error) => {
          Logger.error('registerAppWithFCM: Something went wrong', error)
        })
    }
  }
}
export default new FCMService()
