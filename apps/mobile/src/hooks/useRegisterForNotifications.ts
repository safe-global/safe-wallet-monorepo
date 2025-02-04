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

import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useGTW } from './useGTW'
import { addOrUpdateDelegatedAccount, selectDelegatedAccounts } from '../store/delegatedSlice'
import { Address, SafeInfo } from '../types/address'
import { useNotificationPayload } from './useNotificationPayload'
import { ERROR_MSG, NOTIFICATION_ACCOUNT_TYPE } from '../store/constants'
import { useSign } from './useSign'
import { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { getSigner } from '../utils/notifications'
import { useNotificationGTWPermissions } from './useNotificationGTWPermissions'

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

const useRegisterForNotifications = (): NotificationsProps => {
  // Local states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Custom hooks
  const { data: nonceData } = useAuthGetNonceV1Query()
  const { registerForNotificationsOnBackEnd, unregisterForNotificationsOnBackEnd } = useGTW()
  const { getNotificationRegisterPayload } = useNotificationPayload(appSigners)
  const { getPrivateKey } = useSign()
  // Redux
  const dispatch = useAppDispatch()
  const activeSafe = useDefinedActiveSafe()
  const delegatedAccounts = useAppSelector(selectDelegatedAccounts)
  const { ownerFound, accountType } = useNotificationGTWPermissions().getAccountType()
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
      // Step 1 - Set up Firebase Cloud Messaging steps
      await FCMService.registerAppWithFCM()
      await FCMService.saveFCMToken()
      const fcmToken = await FCMService.getFCMToken()
      FCMService.listenForMessagesBackground()

      /* Step 3 - Create a new random (delegated) private key to avoid exposing the subscriber's private key
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

      const accountDetails = {
        address: randomDelegatedAccount.address,
        privateKey: randomDelegatedAccount.privateKey, // This is the private key that will be used to sign the message for notification registration only
        type: accountType,
      }

      // Step 5 - Store the random delegated account in the Redux store
      dispatch(
        addOrUpdateDelegatedAccount({
          accountDetails,
          safes: [activeSafe],
        }),
      )

      const signer = getSigner(randomDelegatedAccount.privateKey)
      const { siweMessage } = await getNotificationRegisterPayload({
        nonce: nonceData?.nonce,
        signer,
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
        safeAddress: activeSafe.address,
        signer: signer,
        message: siweMessage,
        chainId: activeSafe.chainId,
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
  }, [nonceData, activeSafe])

  const unregisterForNotifications = useCallback(async () => {
    // Step 1 - Get the payload to unregister for notifications
    try {
      setLoading(true)
      setError(null)

      const delegatedAddress = Object.entries(delegatedAccounts).find(([address, safesSliceItem]) =>
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
      const delegatedAccount = delegatedAccounts[delegatedAddress]
      const privateKey = delegatedAccount?.accountDetails.privateKey

      if (!privateKey) {
        setLoading(false)
        setError(ERROR_MSG)
        return {
          loading,
          error,
        }
      }

      const signer = getSigner(privateKey)

      const { siweMessage } = await getNotificationRegisterPayload({
        nonce: nonceData?.nonce,
        signer,
      })

      // Step 2 - Triggers the final step on the backend
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
  }, [nonceData])

  const updatePermissionsForNotifications = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
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
      const delegatedAccount = delegatedAccounts[delegatedAddress]
      const privateKey = delegatedAccount?.accountDetails.privateKey

      if (!privateKey || !fcmToken) {
        setLoading(false)
        setError(ERROR_MSG)
        return {
          loading,
          error,
        }
      }

      const signer = getSigner(privateKey)

      const { siweMessage } = await getNotificationRegisterPayload({
        nonce: nonceData?.nonce,
        signer,
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
  }, [nonceData])

  return {
    registerForNotifications,
    unregisterForNotifications,
    updatePermissionsForNotifications,
    isLoading: loading,
    error,
  }
}

export default useRegisterForNotifications
