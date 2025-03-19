import { useCallback, useEffect, useRef } from 'react'
import { AppState } from 'react-native'
import NotificationsService from '@/src/services/notifications/NotificationService'
import useRegisterForNotifications from '@/src/hooks/useRegisterForNotifications'
import Logger from '@/src/utils/logger'
import { useAppSelector } from '../store/hooks'
import { selectAppNotificationStatus } from '../store/notificationsSlice'

export const useNotificationManager = () => {
  const isAppNotificationEnabled = useAppSelector(selectAppNotificationStatus)
  const { registerForNotifications, unregisterForNotifications, updatePermissionsForNotifications, isLoading } =
    useRegisterForNotifications()

  const appState = useRef(AppState.currentState)

  const enableNotification = useCallback(async () => {
    try {
      // Check if device notifications are enabled
      const deviceNotificationStatus = await NotificationsService.isDeviceNotificationEnabled()

      if (deviceNotificationStatus) {
        // Register for notifications
        const { loading, error } = await registerForNotifications()

        if (!loading && !error) {
          return true
        }
      } else {
        await NotificationsService.getAllPermissions()
        return false
      }
    } catch (error) {
      Logger.error('Error enabling push notifications', error)
      return false
    }
  }, [registerForNotifications])

  const disableNotification = useCallback(async () => {
    try {
      const { loading, error } = await unregisterForNotifications()
      if (!loading && !error) {
        return true
      }
      return false
    } catch (error) {
      Logger.error('Error disabling push notifications', error)
      return false
    }
  }, [unregisterForNotifications])

  const toggleNotificationState = useCallback(async () => {
    try {
      const deviceNotificationStatus = await NotificationsService.isDeviceNotificationEnabled()

      if (!deviceNotificationStatus && !isAppNotificationEnabled) {
        await NotificationsService.getAllPermissions()
      } else if (deviceNotificationStatus && !isAppNotificationEnabled) {
        await registerForNotifications()
      } else {
        await unregisterForNotifications()
      }
    } catch (error) {
      Logger.error('Error toggling notifications', error)
    }
  }, [isAppNotificationEnabled, registerForNotifications, unregisterForNotifications])

  const updateNotificationPermissions = useCallback(async () => {
    try {
      const { loading, error } = await updatePermissionsForNotifications()

      if (!loading && !error) {
        return true
      }
    } catch (error) {
      Logger.error('Error updating push notifications permissions', error)
      return false
    }
  }, [updatePermissionsForNotifications])

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        const deviceNotificationStatus = await NotificationsService.isDeviceNotificationEnabled()
        if (deviceNotificationStatus && !isAppNotificationEnabled) {
          await registerForNotifications()
        }
      }

      appState.current = nextAppState
    })

    return () => {
      subscription.remove()
    }
  }, [isAppNotificationEnabled, registerForNotifications])

  return {
    isAppNotificationEnabled,
    enableNotification,
    disableNotification,
    toggleNotificationState,
    updateNotificationPermissions,
    isLoading,
  }
}
