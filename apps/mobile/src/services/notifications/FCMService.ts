import { getMessaging } from '@react-native-firebase/messaging'
import Logger from '@/src/utils/logger'
import { withTimeout } from '@/src/utils/notifications'
import { savePushToken } from '@/src/store/notificationsSlice'
import { getStore } from '@/src/store/utils/singletonStore'

class FCMService {
  async getFCMToken(): Promise<string | undefined> {
    const { fcmToken } = getStore().getState().notifications
    const token = fcmToken || undefined
    if (!token) {
      Logger.info('getFCMToken: No FCM token found')
    }
    return token
  }

  async saveFCMToken(): Promise<void> {
    try {
      // Register the app with FCM forcefully to get the token since it has not been reliably saved otherwise
      await getMessaging().registerDeviceForRemoteMessages()
      const fcmToken = await withTimeout(getMessaging().getToken(), 10000)
      Logger.info('FCMService :: fcmToken', fcmToken)
      if (fcmToken) {
        getStore().dispatch(savePushToken(fcmToken))
      }
    } catch (error) {
      Logger.info('FCMService :: error saving', error)
    }
  }

  async registerAppWithFCM(): Promise<void> {
    await getMessaging()
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
      return fcmToken
    } catch (error) {
      Logger.error('initNotification: Something went wrong', error)
      return undefined
    }
  }
}
export default new FCMService()
