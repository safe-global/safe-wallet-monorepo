import { useCallback, useState } from 'react'
import FCMService from '@/src/services/notifications/FCMService'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import {
  toggleAppNotifications,
  updateLastTimePromptAttempted,
  updatePromptAttempts,
} from '@/src/store/notificationsSlice'
import Logger from '@/src/utils/logger'

import { useGTW } from './useGTW'
import { ERROR_MSG } from '../store/constants'
import { getSigner } from '../utils/notifications'
import { useNotificationGTWPermissions } from './useNotificationGTWPermissions'
import { useSign } from './useSign/useSign'
import { selectActiveSafe } from '../store/activeSafeSlice'
import { useGlobalSearchParams } from 'expo-router'
import NotificationService from '../services/notifications/NotificationService'
import { notificationChannels, withTimeout } from '@/src/utils/notifications'
import { selectFirstDelegateForAnySafeOwner } from '../store/delegatesSlice'
import { selectSafeInfo } from '../store/safesSlice'
import { Wallet } from 'ethers'

type RegisterForNotificationsProps = {
  loading: boolean
  error: string | null
}

interface NotificationsProps {
  registerForNotifications: () => Promise<RegisterForNotificationsProps>
  unregisterForNotifications: () => Promise<RegisterForNotificationsProps>
  unregisterSafeFromNotifications: (safeAddress: string, chainId: string) => Promise<RegisterForNotificationsProps>
  updatePermissionsForNotifications: () => Promise<RegisterForNotificationsProps>
  isLoading: boolean
  error: string | null
}

// Helper to create a key ID for the delegate key in keychain
const getDelegateKeyId = (safeAddress: string, delegateAddress: string): string => {
  return `delegate_${safeAddress}_${delegateAddress}`
}

const useRegisterForNotifications = (): NotificationsProps => {
  // Local states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Custom hooks
  const { registerForNotificationsOnBackEnd, unregisterForNotificationsOnBackEnd } = useGTW()
  const { getPrivateKey } = useSign()
  // Redux
  const dispatch = useAppDispatch()
  const activeSafe = useAppSelector(selectActiveSafe)
  const safeInfoItem = useAppSelector((state) => (activeSafe ? selectSafeInfo(state, activeSafe.address) : undefined))
  const safeOverview = safeInfoItem?.SafeInfo

  const glob = useGlobalSearchParams<{ safeAddress?: string; chainId?: string; import_safe?: string }>()

  if (!glob.safeAddress) {
    glob.safeAddress = activeSafe?.address
  }
  if (!glob.chainId) {
    glob.chainId = activeSafe?.chainId
  }

  const safeAddress = glob.safeAddress
  const chainId = glob.chainId

  // Use the selector to find the first delegate for any owner of the safe
  const delegatesForNotification = useAppSelector((state) =>
    safeAddress ? selectFirstDelegateForAnySafeOwner(state, safeAddress as `0x${string}`) : null,
  )

  // Only call getAccountType when safeAddress is defined
  const accountTypeInfo = useNotificationGTWPermissions(
    safeAddress ? (safeAddress as `0x${string}`) : ('0x' as `0x${string}`),
  ).getAccountType()

  const { ownerFound, accountType } = accountTypeInfo

  // Helper function to get signer from delegate
  const getSignerFromDelegate = async (delegate: { owner: string; delegateAddress: string } | null) => {
    if (!delegate) return { signer: null, owner: null, delegateAddress: null }

    const { owner, delegateAddress } = delegate
    const delegateKeyId = getDelegateKeyId(owner, delegateAddress)
    const privateKey = await getPrivateKey(delegateKeyId, { requireAuthentication: false })
    const signer = privateKey ? getSigner(privateKey) : null

    return { signer, owner, delegateAddress }
  }

  /*
   * Push notifications can be enabled by two types of users: the owner of the safe or an observer of the safe
   * In the first case, the owner can subscribe to ALL NotificationTypes listed in @safe-global/store/gateway/AUTO_GENERATED/notifications
   * including confirmation requests notifications
   * In the second case, the observer notifications will not include confirmation requests
   *
   * We only notify required confirmation events to owners or delegates
   * to prevent other subscribers from receiving "private" events
   */
  const registerForNotifications = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      if (!activeSafe || !safeOverview) {
        setLoading(false)
        setError(ERROR_MSG)
        return {
          loading,
          error,
        }
      }

      const fcmToken = await FCMService.initNotification()
      await withTimeout(NotificationService.createChannel(notificationChannels[0]), 5000)

      // Get signer from delegate
      const { signer } = await getSignerFromDelegate(delegatesForNotification)

      registerForNotificationsOnBackEnd({
        safeAddress: safeAddress as `0x${string}`,
        signer,
        chainId: chainId as string,
        fcmToken: fcmToken || '',
        notificationAccountType: accountType,
      }).then(() => {
        dispatch(toggleAppNotifications(true))
        dispatch(updatePromptAttempts(0))
        dispatch(updateLastTimePromptAttempted(0))
        setLoading(false)
        setError(null)
      })
    } catch (error) {
      Logger.error('FCM Registration failed', error)
      setLoading(false)
      setError(error as string)
    }
    return {
      loading,
      error,
    }
  }, [activeSafe, safeOverview, delegatesForNotification, getPrivateKey, safeAddress, chainId])

  const unregisterForNotifications = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('unregisterForNotifications :: activeSafe', activeSafe)
      console.log('unregisterForNotifications :: safeOverview', safeOverview)
      if (!activeSafe || !safeOverview) {
        setLoading(false)
        setError(ERROR_MSG)
        return {
          loading,
          error,
        }
      }

      console.log('unregister')

      // Get signer from delegate
      const { signer } = await getSignerFromDelegate(delegatesForNotification)

      // Triggers the final step on the backend
      unregisterForNotificationsOnBackEnd({
        signer,
        activeSafe,
      }).then(() => {
        dispatch(toggleAppNotifications(false))
        dispatch(updatePromptAttempts(0))
        dispatch(updateLastTimePromptAttempted(0))
        setLoading(false)
        setError(null)
      })
    } catch (error) {
      Logger.error('FCM Unregistration failed', error)
      setLoading(false)
      setError(error as string)
    }
    return {
      loading,
      error,
    }
  }, [activeSafe, safeOverview, delegatesForNotification, getPrivateKey, safeAddress, chainId])

  const registerSafeForNotifications = useCallback(
    async (safeAddress: string, chainId: string) => {
      try {
        setLoading(true)
        setError(null)
        if (!safeAddress || !chainId) {
          setLoading(false)
          setError('No safe address or chain ID provided')
          return {
            loading,
            error,
          }
        }

        const fcmToken = await FCMService.initNotification()
        await withTimeout(NotificationService.createChannel(notificationChannels[0]), 5000)

        // Get signer from delegate
        const { signer } = await getSignerFromDelegate(delegatesForNotification)

        registerForNotificationsOnBackEnd({
          safeAddress: safeAddress as `0x${string}`,
          signer,
          chainId: chainId as string,
          fcmToken: fcmToken || '',
          notificationAccountType: accountType,
        }).then(() => {
          setLoading(false)
          setError(null)
        })
      } catch (error) {
        Logger.error('FCM Registration failed', error)
        setLoading(false)
        setError(error as string)
      }
      return {
        loading,
        error,
      }
    },
    [delegatesForNotification, getPrivateKey],
  )

  // New method to unregister a specific safe without toggling app notifications
  const unregisterSafeFromNotifications = useCallback(async (safeAddress: string, chainId: string) => {
    try {
      setLoading(true)
      setError(null)

      if (!safeAddress || !chainId) {
        setLoading(false)
        setError('Missing safe address or chain ID')
        return { loading, error }
      }

      // For the specific safe, we'll work with whatever delegate we can find at the time of unregistration
      // We don't rely on React hooks inside callbacks

      // Triggers the backend unregistration without affecting app notification state
      await unregisterForNotificationsOnBackEnd({
        signer: null, // We'll attempt to unregister without a signer
        activeSafe: { address: safeAddress as `0x${string}`, chainId },
      })

      setLoading(false)
      setError(null)
    } catch (error) {
      Logger.error('Safe unregistration from notifications failed', error)
      setLoading(false)
      setError(error as string)
    }
    return {
      loading,
      error,
    }
  }, [])

  const updatePermissionsForNotifications = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (!activeSafe || !safeOverview) {
        setLoading(false)
        setError(ERROR_MSG)
        return {
          loading,
          error,
        }
      }

      const fcmToken = await FCMService.getFCMToken()

      if (!delegatesForNotification) {
        setLoading(false)
        setError('No delegate found to update permissions')
        return {
          loading,
          error,
        }
      }

      // Get signer from delegate
      const { signer, owner, delegateAddress } = await getSignerFromDelegate(delegatesForNotification)

      if (!signer || !fcmToken) {
        setLoading(false)
        setError('Failed to retrieve delegate key or FCM token')
        return {
          loading,
          error,
        }
      }

      registerForNotificationsOnBackEnd({
        safeAddress: activeSafe.address,
        signer,
        chainId: activeSafe.chainId,
        fcmToken,
        notificationAccountType: accountType,
      }).then(() => {
        setLoading(false)
        setError(null)
      })
    } catch (error) {
      Logger.error('Notification permission update failed', error)
      setLoading(false)
      setError(error as string)
    }
    return {
      loading,
      error,
    }
  }, [activeSafe, safeOverview, delegatesForNotification, getPrivateKey, safeAddress, chainId])

  return {
    registerForNotifications,
    unregisterForNotifications,
    unregisterSafeFromNotifications,
    updatePermissionsForNotifications,
    isLoading: loading,
    error,
  }
}

export default useRegisterForNotifications
