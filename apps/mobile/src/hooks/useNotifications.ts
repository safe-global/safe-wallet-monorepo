import { useEffect } from 'react'
import FCMService from '@/src/services/notifications/FCMService'
import { useAppSelector, useAppDispatch } from '@/src/store/hooks'
import {
  selectAppNotificationStatus,
  selectDeviceNotificationStatus,
  selectFCMToken,
  selectPromptAttempts,
  selectLastTimePromptAttempted,
  selectRemoteMessages,
  toggleAppNotifications,
} from '@/src/store/notificationsSlice'
import NotificationService from '@/src/services/notifications/NotificationService'
import { FirebaseMessagingTypes } from '@react-native-firebase/messaging'

interface NotificationsProps {
  isDeviceNotificationEnabled: boolean
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
  const isDeviceNotificationEnabled = useAppSelector(selectDeviceNotificationStatus)
  const isAppNotificationEnabled = useAppSelector(selectAppNotificationStatus)
  const fcmToken = useAppSelector(selectFCMToken)
  const remoteMessages = useAppSelector(selectRemoteMessages)
  const promptAttempts = useAppSelector(selectPromptAttempts)
  const lastTimePromptAttempted = useAppSelector(selectLastTimePromptAttempted)

  useEffect(() => {
    const checkNotifications = async () => {
      if (!isDeviceNotificationEnabled) {
        /**
         * If the user has been prompt more than 3 times within a month to enable the notifications
         * we should only ask the user to enable it again after a month has passed
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

        const { permission } = await NotificationService.getAllPermissions()

        if (permission !== 'authorized') {
          return
        }
      }
      // Firebase Cloud Messaging
      FCMService.registerAppWithFCM().then(() => {
        FCMService.saveFCMToken()
        FCMService.listenForMessagesBackground()
      })

      const unsubscribeForegroundEvent = FCMService.listenForMessagesForeground()

      return () => {
        unsubscribeForegroundEvent()
      }
    }

    checkNotifications()
  }, [isDeviceNotificationEnabled, isAppNotificationEnabled])

  return { isDeviceNotificationEnabled, isAppNotificationEnabled, fcmToken, remoteMessages }
}

export default useNotifications
