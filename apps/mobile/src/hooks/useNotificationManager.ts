import { useCallback, useEffect, useRef } from 'react'
import { AppState } from 'react-native'
import NotificationsService from '@/src/services/notifications/NotificationService'
import useRegisterForNotifications from '@/src/hooks/useRegisterForNotifications'
import Logger from '@/src/utils/logger'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { selectAppNotificationStatus, toggleDeviceNotifications } from '../store/notificationsSlice'

export const useNotificationManager = () => {
  const dispatch = useAppDispatch()

  const isAppNotificationEnabled = useAppSelector(selectAppNotificationStatus)

  const { registerForNotifications, unregisterForNotifications, updatePermissionsForNotifications, isLoading } =
    useRegisterForNotifications()

  const appState = useRef(AppState.currentState)

  // Using a ref instead of state to ensure the value persists across app background/foreground cycles
  const pendingPermissionRequestRef = useRef(false)

  // Helper for openSettings flow
  const openSettingsForPermissions = useCallback(async () => {
    // Mark that we're about to request permissions and redirect to settings
    pendingPermissionRequestRef.current = true

    // This will potentially open settings depending on the permission status
    const result = await NotificationsService.handlePermissionFlow(true)

    return result
  }, [])

  const enableNotification = useCallback(async () => {
    try {
      // Check if device notifications are enabled
      const deviceNotificationStatus = await NotificationsService.isDeviceNotificationEnabled()

      if (deviceNotificationStatus) {
        const { loading, error } = await registerForNotifications()

        if (!loading && !error) {
          dispatch(toggleDeviceNotifications(true))
          return true
        }
        return false
      } else {
        // Open settings and get result
        const { granted } = await openSettingsForPermissions()

        if (granted) {
          const { loading, error } = await registerForNotifications()

          pendingPermissionRequestRef.current = false

          if (!loading && !error) {
            dispatch(toggleDeviceNotifications(true))
            return true
          }
        }

        return false
      }
    } catch (error) {
      pendingPermissionRequestRef.current = false
      Logger.error('Error enabling push notifications', error)
      return false
    }
  }, [dispatch, registerForNotifications, openSettingsForPermissions])

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
        // Open settings and get result
        const { granted } = await openSettingsForPermissions()

        if (granted) {
          const { loading, error } = await registerForNotifications()

          pendingPermissionRequestRef.current = false

          if (!loading && !error) {
            dispatch(toggleDeviceNotifications(true))
            return true
          }
        }

        // Don't clear the flag here if not granted immediately
      } else if (deviceNotificationStatus && !isAppNotificationEnabled) {
        await registerForNotifications()
      } else {
        await unregisterForNotifications()
      }
    } catch (error) {
      pendingPermissionRequestRef.current = false
      Logger.error('Error toggling notifications', error)
    }
  }, [
    isAppNotificationEnabled,
    registerForNotifications,
    unregisterForNotifications,
    dispatch,
    openSettingsForPermissions,
  ])

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
        // App has come to the foreground
        const deviceNotificationStatus = await NotificationsService.isDeviceNotificationEnabled()

        // CASE 1: App notifications enabled but device notifications disabled
        // Action: Disable app notifications to keep in sync
        if (!deviceNotificationStatus && isAppNotificationEnabled) {
          await disableNotification()
        }

        // CASE 2: Device notifications enabled but app notifications disabled
        // Action: Only enable app notifications if we were waiting for the user to return from settings
        else if (deviceNotificationStatus && !isAppNotificationEnabled && pendingPermissionRequestRef.current) {
          await registerForNotifications()
          // Clear the pending flag after handling
          pendingPermissionRequestRef.current = false
        }
      }

      appState.current = nextAppState
    })

    return () => {
      subscription.remove()
    }
  }, [isAppNotificationEnabled, registerForNotifications, disableNotification])

  return {
    isAppNotificationEnabled,
    enableNotification,
    disableNotification,
    toggleNotificationState,
    updateNotificationPermissions,
    isLoading,
  }
}
