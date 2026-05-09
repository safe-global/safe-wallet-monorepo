import { cgwApi as notificationsApi } from '@safe-global/store/gateway/AUTO_GENERATED/notifications'
import { getDeviceUuid, registerForNotificationsOnBackEnd } from '@/src/services/notifications/backend'
import FCMService from '@/src/services/notifications/FCMService'
import { NOTIFICATION_ACCOUNT_TYPE } from '@/src/store/constants'
import { getStore } from '@/src/store/utils/singletonStore'
import { createSubscriptionData, clearAuthBeforeUnauthenticatedCall } from '@/src/utils/notifications/cleanup'
import { withRateLimitRetry } from '@/src/utils/retry'
import Logger from '@/src/utils/logger'

export const unsubscribeDelegateFromNotifications = async (
  safeAddress: string,
  delegateAddress: string,
  chainIds: string[],
): Promise<void> => {
  const deviceUuid = await getDeviceUuid()
  const subscriptions = await createSubscriptionData(safeAddress, chainIds, deviceUuid, delegateAddress)

  await withRateLimitRetry(async () => {
    await getStore()
      .dispatch(
        notificationsApi.endpoints.notificationsDeleteAllSubscriptionsV2.initiate({
          deleteAllSubscriptionsDto: { subscriptions },
        }),
      )
      .unwrap()
  })

  Logger.info(`Unsubscribed delegate ${delegateAddress} from safe ${safeAddress}`, {
    safeAddress,
    delegateAddress,
    chainIds,
  })
}

export const subscribeToRegularNotifications = async (safeAddress: string, chainIds: string[]): Promise<void> => {
  const fcmToken = await FCMService.getFCMToken()

  if (!fcmToken) {
    Logger.warn('No FCM token available for regular notification subscription')
    return
  }

  // Clear authentication cookies first to prevent React Native bug where credentials: 'omit' is ignored
  await clearAuthBeforeUnauthenticatedCall()

  await registerForNotificationsOnBackEnd({
    safeAddress,
    signer: null, // No signer for regular notifications
    chainIds,
    fcmToken,
    notificationAccountType: NOTIFICATION_ACCOUNT_TYPE.OWNER,
    noAuth: true, // Don't send credentials to avoid automatic delegate subscription
  })

  Logger.info(`Subscribed to regular notifications for safe ${safeAddress}`, {
    safeAddress,
    chainIds,
  })
}

export const cleanupSafeNotifications = async (
  safeAddress: string,
  chainIds: string[],
  delegateAddress: string,
  hasOtherDelegates: boolean,
): Promise<void> => {
  // Unsubscribe the specific delegate
  await unsubscribeDelegateFromNotifications(safeAddress, delegateAddress, chainIds)

  // If no other delegates remain, subscribe to regular notifications
  if (!hasOtherDelegates) {
    await subscribeToRegularNotifications(safeAddress, chainIds)
  }
}
