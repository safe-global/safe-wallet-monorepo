import { useEffect } from 'react'
import FCMService from '@/src/services/notifications/FCMService'
import { useAppSelector, useAppDispatch } from '@/src/store/hooks'
import {
  selectAppNotificationStatus,
  selectFCMToken,
  selectPromptAttempts,
  selectLastTimePromptAttempted,
  selectRemoteMessages,
  toggleAppNotifications,
} from '@/src/store/notificationsSlice'
import NotificationsService from '@/src/services/notifications/NotificationService'
import { FirebaseMessagingTypes } from '@react-native-firebase/messaging'
import Logger from '@/src/utils/logger'

interface NotificationsProps {
  isAppNotificationEnabled: boolean
  fcmToken: string | null
  remoteMessages: FirebaseMessagingTypes.RemoteMessage[]
}

const useNotifications = (): NotificationsProps => {
  const dispatch = useAppDispatch()
  /**
   * We need to check if the user has enabled notifications for the device in order to keep listening for messages
   * since the user can disable notifications at any time on their device, we need to handle app behavior accordingly
   * if device notifications are disabled, the user has been prompt more than 3 times within a month to enable the app notifications
   * we should only ask the user to enable notifications again after a month has passed
   *
   * If the user has disabled notifications for the app,  we should disable app notifications
   */
  const isAppNotificationEnabled = useAppSelector(selectAppNotificationStatus)
  const fcmToken = useAppSelector(selectFCMToken)
  const remoteMessages = useAppSelector(selectRemoteMessages)

  const promptAttempts = useAppSelector(selectPromptAttempts)
  const lastTimePromptAttempted = useAppSelector(selectLastTimePromptAttempted)

  useEffect(() => {
    const checkNotifications = async () => {
      const isDeviceNotificationEnabled = await NotificationsService.isDeviceNotificationEnabled()
      if (!isDeviceNotificationEnabled) {
        /**
         * If the user has been prompt more than 3 times within a month to enable the device notifications
         * we should only ask the user to enable it again after a month has passed
         *
         * This also disables app notifications if the user has disabled device notifications and denied to re-enabled it after 3 attempts
         */
        if (
          promptAttempts &&
          promptAttempts >= 3 &&
          lastTimePromptAttempted &&
          new Date().getTime() - new Date(lastTimePromptAttempted).getTime() < 2592000000
        ) {
          if (isAppNotificationEnabled) {
            dispatch(toggleAppNotifications(false))
          }
          return
        }

        const { permission } = await NotificationsService.getAllPermissions()

        if (permission !== 'authorized') {
          return
        }
      }

      try {
        // Firebase Cloud Messaging
        await FCMService.registerAppWithFCM()
        await FCMService.saveFCMToken()
        FCMService.listenForMessagesBackground()
      } catch (error) {
        Logger.error('FCM Registration or Token Save failed', error)
        return
      }

      return () => {
        FCMService.listenForMessagesForeground()()
      }
    }

    checkNotifications()
  }, [isAppNotificationEnabled])

  return { isAppNotificationEnabled, fcmToken, remoteMessages }
}

export default useNotifications
