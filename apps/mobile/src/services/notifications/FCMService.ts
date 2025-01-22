import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging'
import { STORAGE_IDS } from '@/src/store/constants'
import Logger from '@/src/utils/logger'
import { reduxStorage } from '@/src/store/storage'
import NotificationsService from './NotificationService'
import { ChannelId } from '@/src/utils/notifications'
import { store } from '@/src/store'
import { savePushToken } from '@/src/store/notificationsSlice'

type UnsubscribeFunc = () => void

class FCMService {
  getFCMToken = async (): Promise<string | undefined> => {
    const fcmTokenLocal = await reduxStorage.getItem(STORAGE_IDS.SAFE_FCM_TOKEN)
    const token = fcmTokenLocal?.data || undefined
    if (!token) {
      Logger.info('getFCMToken: No FCM token found')
    }
    return token
  }

  saveFCMToken = async () => {
    try {
      const fcmToken = await messaging().getToken()
      if (fcmToken) {
        store.dispatch(savePushToken(fcmToken))
        reduxStorage.setItem(STORAGE_IDS.SAFE_FCM_TOKEN, fcmToken)
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

  registerAppWithFCM = async () => {
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
