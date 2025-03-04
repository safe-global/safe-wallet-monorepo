// src/hooks/useNotificationManager.ts
import { useCallback, useEffect, useRef } from 'react'
import { AppState } from 'react-native'
import { useAppDispatch } from '@/src/store/hooks'
import NotificationsService from '@/src/services/notifications/NotificationService'
import { toggleAppNotifications } from '@/src/store/notificationsSlice'
import { useDelegateKey } from '@/src/hooks/useDelegateKey'
import useNotifications from '@/src/hooks/useNotifications'
import { useAuthGetNonceV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/auth'
import Logger from '@/src/utils/logger'

export const useNotificationManager = () => {
  const dispatch = useAppDispatch()
  const { enableNotifications, isAppNotificationEnabled } = useNotifications()
  const { data: nonceData } = useAuthGetNonceV1Query()
  const { createDelegate, deleteDelegate, error } = useDelegateKey()
  const appState = useRef(AppState.currentState)

  const enableNotificationsWithDelegate = useCallback(async () => {
    try {
      const deviceNotificationStatus = await NotificationsService.isDeviceNotificationEnabled()
      if (deviceNotificationStatus) {
        enableNotifications()
        await createDelegate(nonceData)
        return true
      } else {
        await NotificationsService.getAllPermissions(true)
        return false
      }
    } catch (error) {
      Logger.error('Error enabling push notifications', error)
      return false
    }
  }, [nonceData, enableNotifications, createDelegate])

  const disableNotifications = useCallback(async () => {
    try {
      await deleteDelegate()
      if (!error) {
        dispatch(toggleAppNotifications(false))
        return true
      }
      return false
    } catch (error) {
      Logger.error('Error disabling push notifications', error)
      return false
    }
  }, [deleteDelegate, error, dispatch])

  const toggleNotificationState = useCallback(async () => {
    try {
      const deviceNotificationStatus = await NotificationsService.isDeviceNotificationEnabled()

      if (!deviceNotificationStatus && !isAppNotificationEnabled) {
        await NotificationsService.requestPushNotificationsPermission()
      } else if (deviceNotificationStatus && !isAppNotificationEnabled) {
        await enableNotificationsWithDelegate()
      } else {
        await disableNotifications()
      }
    } catch (error) {
      Logger.error('Error toggling notifications', error)
    }
  }, [isAppNotificationEnabled, enableNotificationsWithDelegate, disableNotifications])

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        const deviceNotificationStatus = await NotificationsService.isDeviceNotificationEnabled()
        if (deviceNotificationStatus && !isAppNotificationEnabled) {
          enableNotifications()
          await createDelegate(nonceData)
        }
      }

      appState.current = nextAppState
    })

    return () => {
      subscription.remove()
    }
  }, [isAppNotificationEnabled, nonceData, enableNotifications, createDelegate])

  return {
    isAppNotificationEnabled,
    enableNotificationsWithDelegate,
    disableNotifications,
    toggleNotificationState,
  }
}
