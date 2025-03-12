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
import { addOrUpdateDelegatedAddress, selectDelegatedAddresses } from '../store/delegatedSlice'
import { Address, SafeInfo } from '../types/address'
import { useNotificationPayload } from './useNotificationPayload'
import { ERROR_MSG, NOTIFICATION_ACCOUNT_TYPE } from '../store/constants'
import { useSign } from './useSign'
import { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { RootState } from '../store'
import { selectSafeInfo } from '../store/safesSlice'
import { getSigner } from '../utils/notifications'

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
  const { storePrivateKey, getPrivateKey } = useSign()
  // Redux
  const dispatch = useAppDispatch()
  const activeSafe = useDefinedActiveSafe()
  const delegatedAddresses = useAppSelector(selectDelegatedAddresses)
  const activeSafeInfo = useAppSelector((state: RootState) => selectSafeInfo(state, activeSafe.address))
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

      storePrivateKey(randomDelegatedAccount.address, randomDelegatedAccount.privateKey)

      const ownerFound = activeSafeInfo.SafeInfo.owners.find((owner) => appSigners[owner.value]) ?? null
      const accountType = ownerFound ? NOTIFICATION_ACCOUNT_TYPE.OWNER : NOTIFICATION_ACCOUNT_TYPE.REGULAR

      const proposedSignerPK = ownerFound ? await getPrivateKey(ownerFound.value) : randomDelegatedAccount.privateKey 

      if (!proposedSignerPK) {
        setLoading(false)
        setError(ERROR_MSG)
        return {
          loading,
          error,
        }
      }

      const signer = getSigner(proposedSignerPK)

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
    // Step 1 - Get the payload to unregister for notifications
    try {
      setLoading(true)
      setError(null)

      const delegatedAddress = Object.entries(delegatedAddresses).find(([address, safesSliceItem]) =>
        safesSliceItem.safes.some((safe: SafeInfo) => safe.address === activeSafe.address)
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

      const delegatedPK = await getPrivateKey(delegatedAddress)

      if (!delegatedPK) {
        setLoading(false)
        setError(ERROR_MSG)
        return {
          loading,
          error,
        }
      }

      const signer = getSigner(delegatedPK)

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

  return {
    registerForNotifications,
    unregisterForNotifications,
  }
}

export default useRegisterForNotifications
