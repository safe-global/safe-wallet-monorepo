import { useCallback, useState } from 'react'
import { Wallet } from 'ethers'
import { useAuthGetNonceV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/auth'
import FCMService from '@/src/services/notifications/FCMService'
import { useAppDispatch } from '@/src/store/hooks'
import {
  toggleAppNotifications,
  updateLastTimePromptAttempted,
  updatePromptAttempts,
} from '@/src/store/notificationsSlice'
import Logger from '@/src/utils/logger'

import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useGTW } from './useGTW'
import { addOrUpdateDelegatedAddress } from '../store/delegatedSlice'
import { Address } from '../types/address'
import { useNotificationPayload } from './useNotificationPayload'
import { ERROR_MSG } from '../store/constants'
import { useSign } from './useSign'
import { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/safes'

type RegisterForNotificationsProps = {
  loading: boolean
  error: string | null
}

interface NotificationsProps {
  registerForNotifications: () => Promise<RegisterForNotificationsProps>
  unregisterForNotifications: () => Promise<RegisterForNotificationsProps>
}

const useRegisterForNotifications = ({
  appSigners,
}: {
  appSigners: Record<string, AddressInfo>
}): NotificationsProps => {
  // Local states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Custom hooks
  const { data: nonceData } = useAuthGetNonceV1Query()
  const { registerForNotificationsOnBackEnd, unregisterForNotificationsOnBackEnd } = useGTW()
  const { getNotificationRegisterPayload } = useNotificationPayload(appSigners)
  const { storePrivateKey } = useSign()
  // Redux
  const dispatch = useAppDispatch()
  const activeSafe = useDefinedActiveSafe()

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
      FCMService.listenForMessagesBackground()

      /* Step 2 - Create a new random (delegated) private key to avoid exposing the subscriber's private key
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

      // Step 3 - Store the delegated account in the redux store
      dispatch(
        addOrUpdateDelegatedAddress({
          delegatedAddress: randomDelegatedAccount.address as Address,
          safes: [activeSafe],
        }),
      )

      // Step 4 - Store it in the keychain
      storePrivateKey(randomDelegatedAccount.address, randomDelegatedAccount.privateKey)

      // Step 5 - Get the payload to register for notifications
      const { signer, fcmToken, siweMessage, accountType } = await getNotificationRegisterPayload(nonceData?.nonce)
      console.log('registerForNotifications', { signer, fcmToken, siweMessage, accountType })

      // Step 6 - Triggers the final step on the backend
      registerForNotificationsOnBackEnd({
        safeAddress: activeSafe.address,
        signer: signer,
        message: siweMessage,
        chainId: activeSafe.chainId,
        fcmToken,
        delegatedAccount: randomDelegatedAccount,
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
    try {
      setLoading(true)
      setError(null)
      // Step 1 - Get the payload to unregister for notifications
      const { signer, siweMessage } = await getNotificationRegisterPayload(nonceData?.nonce)

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

  return {
    registerForNotifications,
    unregisterForNotifications,
  }
}

export default useRegisterForNotifications
