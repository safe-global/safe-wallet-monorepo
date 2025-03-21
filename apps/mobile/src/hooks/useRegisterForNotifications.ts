import { useCallback, useState } from 'react'
import { Wallet } from 'ethers'
import { useAuthGetNonceV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/auth'
import FCMService from '@/src/services/notifications/FCMService'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import {
  toggleAppNotifications,
  updateLastTimePromptAttempted,
  updatePromptAttempts,
} from '@/src/store/notificationsSlice'
import Logger from '@/src/utils/logger'

import { useGTW } from './useGTW'
import { addOrUpdateDelegatedAccount, selectDelegatedAccounts } from '../store/delegatedSlice'
import { Address, SafeInfo } from '../types/address'
import { useNotificationPayload } from './useNotificationPayload'
import { ERROR_MSG } from '../store/constants'
import { getSigner } from '../utils/notifications'
import { useNotificationGTWPermissions } from './useNotificationGTWPermissions'
import { useSign } from './useSign/useSign'
import { selectActiveSafe } from '../store/activeSafeSlice'
import { useGlobalSearchParams } from 'expo-router'

type RegisterForNotificationsProps = {
  loading: boolean
  error: string | null
}

interface NotificationsProps {
  registerForNotifications: () => Promise<RegisterForNotificationsProps>
  unregisterForNotifications: () => Promise<RegisterForNotificationsProps>
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
  const { data: nonceData } = useAuthGetNonceV1Query()
  const { registerForNotificationsOnBackEnd, unregisterForNotificationsOnBackEnd } = useGTW()
  const { getNotificationRegisterPayload } = useNotificationPayload()
  const { storePrivateKey, getPrivateKey } = useSign()
  // Redux
  const dispatch = useAppDispatch()
  const activeSafe = useAppSelector(selectActiveSafe)
  const delegatedAccounts = useAppSelector(selectDelegatedAccounts)

  const glob = useGlobalSearchParams<{ safeAddress?: string; chainId?: string; import_safe?: string }>()

  if (!glob.safeAddress) {
    glob.safeAddress = activeSafe?.address
  }
  if (!glob.chainId) {
    glob.chainId = activeSafe?.chainId
  }

  const safeAddress = glob.safeAddress
  const chainId = glob.chainId

  const { ownerFound, accountType } = useNotificationGTWPermissions(safeAddress as `0x${string}`).getAccountType()

  /*
   * Push notifications can be enabled by an two type of users. The owner of the safe or an observer of the safe
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

      if (!activeSafe) {
        setLoading(false)
        setError(ERROR_MSG)
        return {
          loading,
          error,
        }
      }
      const fcmToken = await FCMService.initNotification()

      /* IMPORTANT - Create a new random (delegated) private key to avoid exposing the subscriber's private key
       *
       * This key will be used to register for notifications on the backend
       * avoiding the prompt to grant notifications permission
       */
      const randomDelegatedAccount = Wallet.createRandom()

      if (!randomDelegatedAccount) {
        setLoading(false)
        setError(ERROR_MSG)
        return {
          loading,
          error,
        }
      }

      // Store the private key in the keychain with default protection (no biometrics)
      const delegateKeyId = getDelegateKeyId(activeSafe.address, randomDelegatedAccount.address)
      const storeSuccess = await storePrivateKey(delegateKeyId, randomDelegatedAccount.privateKey, {
        requireAuthentication: false,
      })

      if (!storeSuccess) {
        setLoading(false)
        setError('Failed to securely store delegate key')
        return {
          loading,
          error,
        }
      }

      const accountDetails = {
        address: randomDelegatedAccount.address,
        type: accountType,
      }

      dispatch(
        addOrUpdateDelegatedAccount({
          accountDetails,
          safes: [activeSafe],
        }),
      )

      const { siweMessage } = await getNotificationRegisterPayload({
        nonce: nonceData?.nonce,
        signer: randomDelegatedAccount,
        chainId: chainId as string,
      })

      if (!fcmToken) {
        setLoading(false)
        setError(ERROR_MSG)
        return {
          loading,
          error,
        }
      }

      registerForNotificationsOnBackEnd({
        safeAddress: safeAddress as `0x${string}`,
        signer: randomDelegatedAccount,
        message: siweMessage,
        chainId: chainId as string,
        fcmToken,
        delegatorAddress: ownerFound?.value,
        delegatedAccountAddress: randomDelegatedAccount.address,
        notificationAccountType: accountType,
      }).then(() => {
        // Upon successful registration, the Redux store is updated
        dispatch(toggleAppNotifications(true))
        dispatch(updatePromptAttempts(0))
        dispatch(updateLastTimePromptAttempted(0))

        setLoading(false)
        setError(null)
      })
    } catch (error) {
      Logger.error('FCM Registration or Token Save failed', error)
      setLoading(false)
      setError(error as string)
    }
    return {
      loading,
      error,
    }
  }, [nonceData, activeSafe, storePrivateKey, safeAddress, chainId])

  const unregisterForNotifications = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (!activeSafe) {
        setLoading(false)
        setError(ERROR_MSG)
        return {
          loading,
          error,
        }
      }

      const delegatedAddress = Object.entries(delegatedAccounts).find(([, safesSliceItem]) =>
        safesSliceItem.safes.some((safe: SafeInfo) => safe.address === activeSafe.address),
      )?.[0] as Address

      if (!delegatedAddress) {
        setLoading(false)
        Logger.error('Delegated address not found')
        setError(ERROR_MSG)
        return {
          loading,
          error,
        }
      }

      // Retrieve the private key from the keychain
      const delegateKeyId = getDelegateKeyId(activeSafe.address, delegatedAddress)
      const privateKey = await getPrivateKey(delegateKeyId, { requireAuthentication: false })

      if (!privateKey) {
        setLoading(false)
        setError('Failed to retrieve delegate key')
        return {
          loading,
          error,
        }
      }

      const signer = getSigner(privateKey)

      const { siweMessage } = await getNotificationRegisterPayload({
        nonce: nonceData?.nonce,
        signer,
        chainId: activeSafe.chainId,
      })

      // Triggers the final step on the backend
      unregisterForNotificationsOnBackEnd({
        signer,
        message: siweMessage,
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
  }, [nonceData, activeSafe, getPrivateKey, safeAddress, chainId])

  const updatePermissionsForNotifications = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (!activeSafe) {
        setLoading(false)
        setError(ERROR_MSG)
        return {
          loading,
          error,
        }
      }

      const fcmToken = await FCMService.getFCMToken()

      const delegatedAddress = Object.entries(delegatedAccounts).find(([, safesSliceItem]) =>
        safesSliceItem.safes.some((safe: SafeInfo) => safe.address === activeSafe.address),
      )?.[0] as Address

      if (!delegatedAddress) {
        setLoading(false)
        Logger.error('Delegated address not found')
        setError(ERROR_MSG)
        return {
          loading,
          error,
        }
      }

      // Retrieve the private key from the keychain
      const delegateKeyId = getDelegateKeyId(activeSafe.address, delegatedAddress)
      const privateKey = await getPrivateKey(delegateKeyId, { requireAuthentication: false })

      if (!privateKey || !fcmToken) {
        setLoading(false)
        setError(ERROR_MSG)
        return {
          loading,
          error,
        }
      }

      const signer = getSigner(privateKey)
      const delegatedAccount = delegatedAccounts[delegatedAddress]

      const { siweMessage } = await getNotificationRegisterPayload({
        nonce: nonceData?.nonce,
        signer,
        chainId: activeSafe.chainId,
      })

      registerForNotificationsOnBackEnd({
        safeAddress: activeSafe.address,
        signer: signer,
        message: siweMessage,
        chainId: activeSafe.chainId,
        fcmToken,
        delegatorAddress: ownerFound?.value,
        delegatedAccountAddress: delegatedAccount.accountDetails.address,
        notificationAccountType: accountType,
      }).then(() => {
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
  }, [nonceData, activeSafe, getPrivateKey, safeAddress, chainId])

  return {
    registerForNotifications,
    unregisterForNotifications,
    updatePermissionsForNotifications,
    isLoading: loading,
    error,
  }
}

export default useRegisterForNotifications
