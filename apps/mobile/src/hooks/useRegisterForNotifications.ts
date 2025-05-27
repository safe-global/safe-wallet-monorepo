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

        if (!activeSafe) {
          setLoading(false)
          setError(ERROR_MSG)
          return { loading, error }
        }

        await registerSafe(store, activeSafe.address, allChainIds)

        if (updateNotificationSettings) {
          dispatch(toggleAppNotifications(true))
          dispatch(updatePromptAttempts(0))
          dispatch(updateLastTimePromptAttempted(0))
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
    [activeSafe, dispatch],
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
