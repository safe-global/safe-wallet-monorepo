import { useCallback } from 'react'
import FCMService from '@/src/services/notifications/FCMService'
import { useAppSelector, useAppDispatch } from '@/src/store/hooks'
import {
  selectAppNotificationStatus,
  selectFCMToken,
  selectPromptAttempts,
  selectRemoteMessages,
  updatePromptAttempts,
} from '@/src/store/notificationsSlice'
import NotificationsService from '@/src/services/notifications/NotificationService'
import { FirebaseMessagingTypes } from '@react-native-firebase/messaging'
import Logger from '@/src/utils/logger'

interface NotificationsProps {
  isAppNotificationEnabled: boolean
  fcmToken: string | null
  remoteMessages: FirebaseMessagingTypes.RemoteMessage[]
  enableNotifications: () => void
  promptAttempts: number
}

const useNotifications = (): NotificationsProps => {
  const dispatch = useAppDispatch()
  const isAppNotificationEnabled = useAppSelector(selectAppNotificationStatus)
  const fcmToken = useAppSelector(selectFCMToken)
  const remoteMessages = useAppSelector(selectRemoteMessages)
  const promptAttempts = useAppSelector(selectPromptAttempts)

  const enableNotifications = useCallback(() => {
    const checkNotifications = async () => {
      const isDeviceNotificationEnabled = await NotificationsService.isDeviceNotificationEnabled()
      if (!isDeviceNotificationEnabled) {
        dispatch(updatePromptAttempts(1))

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

  return { enableNotifications, promptAttempts, isAppNotificationEnabled, fcmToken, remoteMessages }
}

export default useNotifications
