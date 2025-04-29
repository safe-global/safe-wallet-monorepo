import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging'
import Logger from '@/src/utils/logger'
import NotificationsService from './NotificationService'
import { ChannelId, withTimeout } from '@/src/utils/notifications'
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
      // Register the app with FCM forcefully to get the token since it has not been reliably saved otherwise
      await messaging().registerDeviceForRemoteMessages()
      const fcmToken = await withTimeout(messaging().getToken(), 10000)
      Logger.info('FCMService :: fcmToken', fcmToken)
      if (fcmToken) {
        store.dispatch(savePushToken(fcmToken))
      }
    } catch (error) {
      Logger.info('FCMService :: error saving', error)
    }
  }

  listenForMessagesForeground = (): UnsubscribeFunc => {
    return messaging().onMessage(async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
      NotificationsService.displayNotification({
        channelId: ChannelId.DEFAULT_NOTIFICATION_CHANNEL_ID,
        title: remoteMessage.notification?.title || '',
        body: remoteMessage.notification?.body || '',
        data: remoteMessage.data,
      })
      Logger.info('listenForMessagesForeground: listening for messages in Foreground', remoteMessage)
    })
  }

  listenForMessagesBackground = (): void => {
    messaging().setBackgroundMessageHandler(async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
      NotificationsService.displayNotification({
        channelId: ChannelId.DEFAULT_NOTIFICATION_CHANNEL_ID,
        title: remoteMessage.notification?.title || '',
        body: remoteMessage.notification?.body || '',
        data: remoteMessage.data,
      })
      Logger.info('listenForMessagesBackground :: listening for messages in background', remoteMessage)
    })
  }

  async registerAppWithFCM(): Promise<void> {
    await messaging()
      .registerDeviceForRemoteMessages()
      .then((status: unknown) => {
        Logger.info('registerDeviceForRemoteMessages status', status)
      })
      .catch((error) => {
        Logger.error('registerAppWithFCM: Something went wrong', error)
      })
  }

  async initNotification(): Promise<string | undefined> {
    try {
      await this.registerAppWithFCM()
      await this.saveFCMToken()
      const fcmToken = await this.getFCMToken()
      this.listenForMessagesBackground()
      return fcmToken
    } catch (error) {
      Logger.error('initNotification: Something went wrong', error)
      return undefined
    }
  }
}
export default new FCMService()
