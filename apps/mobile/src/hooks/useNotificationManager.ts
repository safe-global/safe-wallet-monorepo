import { useCallback, useEffect, useRef } from 'react'
import { AppState, AppStateStatus, Platform } from 'react-native'
import NotificationsService from '@/src/services/notifications/NotificationService'
import useRegisterForNotifications from '@/src/hooks/useRegisterForNotifications'
import Logger from '@/src/utils/logger'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  selectAppNotificationStatus,
  selectPromptAttempts,
  toggleDeviceNotifications,
  updatePromptAttempts,
} from '../store/notificationsSlice'
import { selectActiveSafe } from '../store/activeSafeSlice'
import { selectSafeSubscriptionStatus } from '../store/safeSubscriptionsSlice'

export const useNotificationManager = () => {
  const dispatch = useAppDispatch()
  const promptAttempts = useAppSelector(selectPromptAttempts)
  const isAppNotificationEnabled = useAppSelector(selectAppNotificationStatus)
  const activeSafe = useAppSelector(selectActiveSafe)
  const isSubscribed = useAppSelector((state) =>
    activeSafe ? selectSafeSubscriptionStatus(state, activeSafe.address, activeSafe.chainId) : false,
  )
  const isAndroid = Platform.OS === 'android'
  const promptThreshold = isAndroid ? 3 : 2
  const { registerForNotifications, unregisterForNotifications, updatePermissionsForNotifications, isLoading } =
    useRegisterForNotifications()

  // Using a ref instead of state to ensure the value persists across app background/foreground cycles
  const pendingPermissionRequestRef = useRef(false)

  const requestAndRegister = useCallback(
    async (updateNotificationSettings = true) => {
      const { permission } = await NotificationsService.getAllPermissions()

      if (permission === 'granted') {
        const { loading, error } = await registerForNotifications(updateNotificationSettings)

        pendingPermissionRequestRef.current = false

        if (!loading && !error) {
          dispatch(toggleDeviceNotifications(true))
          return { success: true, permission } as const
        }
      }

      return { success: false, permission } as const
    },
    [dispatch, registerForNotifications],
  )

  const enableNotification = useCallback(async () => {
    try {
      Logger.info('enableNotification :: STARTED', { promptAttempts })
      const deviceNotificationStatus = await NotificationsService.isDeviceNotificationEnabled()

      if (deviceNotificationStatus) {
        const { loading, error } = await registerForNotifications()

        if (!loading && !error) {
          dispatch(toggleDeviceNotifications(true))
          return true
        }
        return false
      }

      // Once iOS auth status is DENIED (user said "no" to the native prompt or disabled in Settings),
      // notifee.requestPermission() is a silent no-op — looping through the threshold just burns
      // taps invisibly. Go straight to the in-app explainer Alert so the user can EXPLICITLY tap
      // "Turn on" to open Settings. Apple 5.1.1(iv): never auto-redirect on denial.
      if (await NotificationsService.isAuthorizationDenied()) {
        pendingPermissionRequestRef.current = true
        await NotificationsService.requestPushNotificationsPermission()
        return false
      }

      // NOT_DETERMINED: the native OS prompt can still be shown. Use the threshold to limit how
      // many times we attempt it before falling back to the explainer.
      if (promptAttempts < promptThreshold) {
        dispatch(updatePromptAttempts(promptAttempts + 1))
        const { success } = await requestAndRegister()
        return success
      }

      pendingPermissionRequestRef.current = true
      await NotificationsService.requestPushNotificationsPermission()
    } catch (error) {
      pendingPermissionRequestRef.current = false
      Logger.error('Error enabling push notifications', error)
      return false
    }
  }, [dispatch, registerForNotifications, promptAttempts, requestAndRegister, promptThreshold])

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
    if (!activeSafe) {
      return
    }
    try {
      const deviceNotificationStatus = await NotificationsService.isDeviceNotificationEnabled()

      if (!isSubscribed) {
        if (!deviceNotificationStatus) {
          const { success, permission } = await requestAndRegister(false)
          if (success) {
            return true
          }
          // Only show the Settings explainer when the OS permission was actually denied.
          // Registration failures with a granted permission (network, backend) must not push
          // the user to Settings — Settings won't help and would leave pendingPermissionRequestRef
          // stuck true. Apple 5.1.1(iv) compliance is unaffected: Settings is still only opened
          // from an explicit "Turn on" tap inside the Alert.
          if (permission === 'denied') {
            pendingPermissionRequestRef.current = true
            await NotificationsService.requestPushNotificationsPermission()
          }
        } else {
          await registerForNotifications(false)
        }
      } else {
        await unregisterForNotifications(false)
      }
    } catch (error) {
      pendingPermissionRequestRef.current = false
      Logger.error('Error toggling notifications', error)
    }
  }, [isSubscribed, registerForNotifications, unregisterForNotifications, dispatch, activeSafe, requestAndRegister])

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
    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
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
