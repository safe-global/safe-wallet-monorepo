import { useCallback } from 'react'
import DeviceInfo from 'react-native-device-info'

import { useAuthVerifyV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/auth'
import {
  useNotificationsUpsertSubscriptionsV2Mutation,
  useNotificationsDeleteSubscriptionV2Mutation,
  NotificationType,
} from '@safe-global/store/gateway/AUTO_GENERATED/notifications'

import { isAndroid } from '../config/constants'
import { Address, SafeInfo } from '../types/address'
import { useSiwe } from './useSiwe'
import Logger from '@/src/utils/logger'
import { HDNodeWallet, Wallet } from 'ethers'
import { NOTIFICATION_ACCOUNT_TYPE } from '../store/constants'
import { OWNER_NOTIFICATIONS, REGULAR_NOTIFICATIONS } from '../utils/notifications'
import { convertToUuid } from '@/src/utils/uuid'
import { useNotificationPayload } from './useNotificationPayload'

export function useGTW() {
  // Queries
  const [authVerifyV1] = useAuthVerifyV1Mutation()
  const [notificationsUpsertSubscriptionsV2] = useNotificationsUpsertSubscriptionsV2Mutation()
  const [notificationsDeleteSubscriptionsV2] = useNotificationsDeleteSubscriptionV2Mutation()
  const { signMessage } = useSiwe()
  const { getNotificationRegisterPayload } = useNotificationPayload()

  // Helper to get device UUID
  const getDeviceUuid = useCallback(async () => {
    const deviceId = await DeviceInfo.getUniqueId()
    return convertToUuid(deviceId)
  }, [])

  // Helper function to authenticate a signer
  const authenticateSigner = useCallback(
    async (signer: Wallet | HDNodeWallet | null, chainId: string) => {
      if (!signer) return

      // Generate message internally
      const { siweMessage } = await getNotificationRegisterPayload({
        signer,
        chainId,
      })

      const signature = await signMessage({ signer, message: siweMessage })
      await authVerifyV1({
        siweDto: {
          message: siweMessage,
          signature,
        },
      })
    },
    [getNotificationRegisterPayload, signMessage, authVerifyV1],
  )

  const registerForNotificationsOnBackEnd = useCallback(
    async ({
      safeAddress,
      signer,
      chainId,
      fcmToken,
      notificationAccountType,
    }: {
      safeAddress: Address
      signer: Wallet | HDNodeWallet | null
      chainId: string
      fcmToken: string
      notificationAccountType?: NOTIFICATION_ACCOUNT_TYPE
    }) => {
      const isOwner = notificationAccountType === NOTIFICATION_ACCOUNT_TYPE.OWNER

      try {
        const deviceUuid = await getDeviceUuid()

        // Use the helper function for authentication
        await authenticateSigner(signer, chainId)

        const NOTIFICATIONS_GRANTED = isOwner ? OWNER_NOTIFICATIONS : REGULAR_NOTIFICATIONS

        await notificationsUpsertSubscriptionsV2({
          upsertSubscriptionsDto: {
            cloudMessagingToken: fcmToken,
            safes: [
              {
                chainId,
                address: safeAddress,
                notificationTypes: NOTIFICATIONS_GRANTED as NotificationType[],
              },
            ],
            deviceType: isAndroid ? 'ANDROID' : 'IOS',
            deviceUuid,
          },
        })
          .unwrap()
          .then((res) => {
            Logger.info('registerForNotificationsOnBackEnd', { res })
          })
      } catch (err) {
        Logger.error('CreateDelegateFailed', err)
        return
      }
    },
    [authenticateSigner, getDeviceUuid, notificationsUpsertSubscriptionsV2],
  )

  const unregisterForNotificationsOnBackEnd = useCallback(
    async ({ signer, activeSafe }: { signer: Wallet | HDNodeWallet | null; activeSafe: SafeInfo | null }) => {
      try {
        if (!activeSafe) {
          throw new Error('DeleteDelegateFailed :: No active safe')
        }

        // Use the helper function for authentication
        await authenticateSigner(signer, activeSafe.chainId)

        const deviceUuid = await getDeviceUuid()
        notificationsDeleteSubscriptionsV2({
          deviceUuid,
          chainId: activeSafe.chainId,
          safeAddress: activeSafe.address,
        })
      } catch (err) {
        Logger.error('DeleteDelegateFailed', err)
        return
      }
    },
    [authenticateSigner, getDeviceUuid, notificationsDeleteSubscriptionsV2],
  )

  return { registerForNotificationsOnBackEnd, unregisterForNotificationsOnBackEnd }
}
