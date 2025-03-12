import { useCallback } from 'react'
import DeviceInfo from 'react-native-device-info'

import { useAuthVerifyV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/auth'
import { useDelegatesPostDelegateV2Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/delegates'
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

export function useGTW() {
  // Queries
  const [authVerifyV1] = useAuthVerifyV1Mutation()
  const [notificationsUpsertSubscriptionsV2] = useNotificationsUpsertSubscriptionsV2Mutation()
  const [notificationsDeleteSubscriptionsV2] = useNotificationsDeleteSubscriptionV2Mutation()
  const [delegatesPostDelegateV2] = useDelegatesPostDelegateV2Mutation()
  const { signMessage } = useSiwe()

  const registerForNotificationsOnBackEnd = useCallback(
    async ({
      safeAddress,
      signer,
      message,
      chainId,
      fcmToken,
      delegatedAccount,
      notificationAccountType,
    }: {
      safeAddress: Address
      signer: Wallet | HDNodeWallet
      message: string
      chainId: string
      fcmToken: string
      delegatedAccount: Wallet | HDNodeWallet
      notificationAccountType?: NOTIFICATION_ACCOUNT_TYPE
    }) => {
      try {
        const signature = await signMessage({ signer, message })
        const deviceUuid = await DeviceInfo.getUniqueId()

        authVerifyV1({
          siweDto: {
            message,
            signature,
          },
        }).then(() => {
          delegatesPostDelegateV2({
            chainId,
            createDelegateDto: {
              safe: safeAddress,
              delegator: signer.address,
              delegate: delegatedAccount.address,
              signature,
              label: NOTIFICATION_ACCOUNT_TYPE.OWNER,
            },
          })
        })

        const NOTIFICATIONS_GRANTED =
          notificationAccountType === NOTIFICATION_ACCOUNT_TYPE.REGULAR ? REGULAR_NOTIFICATIONS : OWNER_NOTIFICATIONS

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
    [],
  )

  const unregisterForNotificationsOnBackEnd = useCallback(
    async ({
      signer,
      message,
      activeSafe,
    }: {
      signer: Wallet | HDNodeWallet
      message: string
      activeSafe: SafeInfo | null
    }) => {
      try {
        if (!activeSafe) {
          throw new Error('DeleteDelegateFailed :: No active safe')
        }

        const signature = await signMessage({ signer, message })
        const deviceUuid = await DeviceInfo.getUniqueId()

        authVerifyV1({
          siweDto: {
            message,
            signature,
          },
        }).then(() => {
          notificationsDeleteSubscriptionsV2({
            deviceUuid,
            chainId: activeSafe.chainId,
            safeAddress: activeSafe.address,
          })
        })
      } catch (err) {
        Logger.error('DeleteDelegateFailed', err)
        return
      }
    },
    [],
  )

  return { registerForNotificationsOnBackEnd, unregisterForNotificationsOnBackEnd }
}
