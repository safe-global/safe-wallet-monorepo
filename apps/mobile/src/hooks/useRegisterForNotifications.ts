import { useCallback, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import {
  toggleAppNotifications,
  updateLastTimePromptAttempted,
  updatePromptAttempts,
} from '@/src/store/notificationsSlice'
import Logger from '@/src/utils/logger'
import { ERROR_MSG } from '../store/constants'
import { selectActiveSafe } from '../store/activeSafeSlice'
import '@safe-global/store/gateway/AUTO_GENERATED/notifications'

import { registerSafe, unregisterSafe } from '@/src/services/notifications/registration'
import { store } from '@/src/store'
import { selectAllChainsIds } from '../store/chains'
import FCMService from '@/src/services/notifications/FCMService'
import NotificationService from '@/src/services/notifications/NotificationService'
import { notificationChannels, withTimeout } from '@/src/utils/notifications'

export type RegisterForNotificationsProps = {
  loading: boolean
  error: string | null
}

interface NotificationsProps {
  registerForNotifications: (updateNotificationSettings?: boolean) => Promise<RegisterForNotificationsProps>
  unregisterForNotifications: (updateNotificationSettings?: boolean) => Promise<RegisterForNotificationsProps>
  updatePermissionsForNotifications: () => Promise<RegisterForNotificationsProps>
  isLoading: boolean
  error: string | null
}

const useRegisterForNotifications = (): NotificationsProps => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dispatch = useAppDispatch()
  const activeSafe = useAppSelector(selectActiveSafe)
  const allChainIds = useAppSelector(selectAllChainsIds)

  const registerForNotifications = useCallback(
    async (updateNotificationSettings = true) => {
      try {
        setLoading(true)
        setError(null)

        // For the initial opt-in, we perform global FCM setup and let the middleware handle all safe registrations
        if (updateNotificationSettings) {
          // Initialize FCM and create notification channels (global setup)
          await FCMService.initNotification()
          await withTimeout(NotificationService.createChannel(notificationChannels[0]), 5000)

          // Dispatch the global toggle - this will trigger the middleware to register all safes
          dispatch(toggleAppNotifications(true))
          dispatch(updatePromptAttempts(0))
          dispatch(updateLastTimePromptAttempted(0))
        } else {
          // For individual safe registration (used by toggle notification state), register only the active safe
          if (!activeSafe) {
            setLoading(false)
            setError(ERROR_MSG)
            return { loading, error }
          }

          await registerSafe(store, activeSafe.address, allChainIds)
        }

        setLoading(false)
        setError(null)
      } catch (err) {
        Logger.error('FCM Registration failed', err)
        setLoading(false)
        setError((err as Error).toString())
      }
      return { loading, error }
    },
    [activeSafe, dispatch, allChainIds],
  )

  const unregisterForNotifications = useCallback(
    async (updateNotificationSettings = true) => {
      try {
        setLoading(true)
        setError(null)

        if (!activeSafe) {
          setLoading(false)
          setError(ERROR_MSG)
          return { loading, error }
        }

        await unregisterSafe(store, activeSafe.address, allChainIds)

        if (updateNotificationSettings) {
          dispatch(toggleAppNotifications(false))
          dispatch(updatePromptAttempts(0))
          dispatch(updateLastTimePromptAttempted(0))
        }
        setLoading(false)
        setError(null)
      } catch (err) {
        Logger.error('FCM Unregistration failed', err)
        setLoading(false)
        setError((err as Error).toString())
      }
      return { loading, error }
    },
    [activeSafe, dispatch],
  )

  const updatePermissionsForNotifications = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (!activeSafe) {
        setLoading(false)
        setError(ERROR_MSG)
        return { loading, error }
      }

      await registerSafe(store, activeSafe.address, [activeSafe.chainId])

      setLoading(false)
      setError(null)
    } catch (err) {
      Logger.error('Notification permission update failed', err)
      setLoading(false)
      setError((err as Error).toString())
    }
    return { loading, error }
  }, [activeSafe])

  return {
    registerForNotifications,
    unregisterForNotifications,
    updatePermissionsForNotifications,
    isLoading: loading,
    error,
  }
}

export default useRegisterForNotifications
