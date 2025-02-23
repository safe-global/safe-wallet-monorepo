import { useCallback } from 'react'
import FCMService from '@/src/services/notifications/FCMService'
import { useAppSelector, useAppDispatch } from '@/src/store/hooks'
import {
  selectAppNotificationStatus,
  selectDeviceNotificationStatus,
  selectFCMToken,
  selectPromptAttempts,
  selectRemoteMessages,
  toggleAppNotifications,
  toggleDeviceNotifications,
  updateLastTimePromptAttempted,
  updatePromptAttempts,
} from '@/src/store/notificationsSlice'
import NotificationsService from '@/src/services/notifications/NotificationService'
import { FirebaseMessagingTypes } from '@react-native-firebase/messaging'
import Logger from '@/src/utils/logger'

interface NotificationsProps {
  isAppNotificationEnabled: boolean
  deviceNotificationStatus: boolean
  fcmToken: string | null
  remoteMessages: FirebaseMessagingTypes.RemoteMessage[]
  enableNotifications: () => void
  checkNotificationsPermission: () => Promise<string>
  promptAttempts: number
}

const useNotifications = (): NotificationsProps => {
  const dispatch = useAppDispatch()
  const isAppNotificationEnabled = useAppSelector(selectAppNotificationStatus)
  const deviceNotificationStatus = useAppSelector(selectDeviceNotificationStatus)
  const fcmToken = useAppSelector(selectFCMToken)
  const remoteMessages = useAppSelector(selectRemoteMessages)
  const promptAttempts = useAppSelector(selectPromptAttempts)

  const checkNotificationsPermission = useCallback(async () => {
    const isDeviceNotificationEnabled = await NotificationsService.isDeviceNotificationEnabled()

    let allPermissions
    if (!isDeviceNotificationEnabled) {
      dispatch(toggleDeviceNotifications(false))
      dispatch(updatePromptAttempts(1))
      allPermissions = await NotificationsService.getAllPermissions(true)
    } else {
      dispatch(toggleDeviceNotifications(true))
      allPermissions = await NotificationsService.getAllPermissions(false)
    }

    const { permission } = allPermissions

    if (permission === 'authorized') {
      dispatch(toggleDeviceNotifications(true))
    }

    return permission
  }, [])

  const enableNotifications = useCallback(async () => {
    try {
      // Firebase Cloud Messaging
      await FCMService.registerAppWithFCM()
      await FCMService.saveFCMToken()
      FCMService.listenForMessagesBackground()

      // Redux store updates
      dispatch(toggleAppNotifications(true))
      dispatch(updatePromptAttempts(0))
      dispatch(updateLastTimePromptAttempted(0))

      return () => {
        FCMService.listenForMessagesForeground()()
      }
    } catch (error) {
      Logger.error('FCM Registration or Token Save failed', error)
      return
    }
  }, [])

  return {
    enableNotifications,
    checkNotificationsPermission,
    promptAttempts,
    isAppNotificationEnabled,
    deviceNotificationStatus,
    fcmToken,
    remoteMessages,
  }
}

export default useNotifications
