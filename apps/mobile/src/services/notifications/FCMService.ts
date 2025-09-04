import { getMessaging } from '@react-native-firebase/messaging'
import Logger from '@/src/utils/logger'
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
      const fcmToken = await getMessaging().getToken()
      Logger.info('FCMService :: fcmToken', fcmToken)
      if (fcmToken) {
        getStore().dispatch(savePushToken(fcmToken))
      }
    } catch (error) {
      Logger.info('FCMService :: error saving', error)
    }
  }

  async initNotification(): Promise<string | undefined> {
    try {
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
