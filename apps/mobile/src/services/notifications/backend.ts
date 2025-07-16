import DeviceInfo from 'react-native-device-info'
import { SiweMessage } from 'siwe'
import { Wallet, HDNodeWallet } from 'ethers'

import { NOTIFICATION_ACCOUNT_TYPE, ERROR_MSG } from '@/src/store/constants'
import { REGULAR_NOTIFICATIONS, OWNER_NOTIFICATIONS } from '@/src/utils/notifications'
import { cgwApi as authApi } from '@safe-global/store/gateway/AUTO_GENERATED/auth'
import { cgwApi as notificationsApi } from '@safe-global/store/gateway/AUTO_GENERATED/notifications'
import { convertToUuid } from '@/src/utils/uuid'
import { isAndroid, GATEWAY_URL } from '@/src/config/constants'
import Logger from '@/src/utils/logger'
import { getStore } from '@/src/store/utils/singletonStore'

export const getDeviceUuid = async () => {
  const deviceId = await DeviceInfo.getUniqueId()
  return convertToUuid(deviceId)
}

const getNotificationRegisterPayload = async ({
  signer,
  chainId,
}: {
  signer: Wallet | HDNodeWallet
  chainId: string
}) => {
  const nonceResponse = await fetch(`${GATEWAY_URL}/v1/auth/nonce`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  })

  if (!nonceResponse.ok) {
    throw new Error(`Failed to get nonce: ${nonceResponse.status} ${nonceResponse.statusText}`)
  }

  const { nonce } = await nonceResponse.json()

  if (!nonce) {
    throw new Error(ERROR_MSG)
  }

  const message = new SiweMessage({
    address: signer.address,
    chainId: Number(chainId),
    domain: 'global.safe.mobileapp',
    statement: 'Safe Wallet wants you to sign in with your Ethereum account',
    nonce,
    uri: 'https://safe.global',
    version: '1',
    issuedAt: new Date().toISOString(),
  })

  return { siweMessage: message.prepareMessage() }
}

export const authenticateSigner = async (signer: Wallet | HDNodeWallet | null, chainId: string) => {
  if (!signer) {
    return
  }

  const signerAddress = signer.address

  const { siweMessage } = await getNotificationRegisterPayload({ signer, chainId })
  const signature = await signer.signMessage(siweMessage)

  await getStore()
    .dispatch(
      authApi.endpoints.authVerifyV1.initiate({
        siweDto: { message: siweMessage, signature },
      }),
    )
    .unwrap()

  Logger.info('Authenticated signer', { signerAddress })
}

export const registerForNotificationsOnBackEnd = async ({
  safeAddress,
  signer,
  chainIds,
  fcmToken,
  notificationAccountType,
}: {
  safeAddress: string
  signer: Wallet | HDNodeWallet | null
  chainIds: string[]
  fcmToken: string
  notificationAccountType: NOTIFICATION_ACCOUNT_TYPE
}) => {
  const isOwner = notificationAccountType === NOTIFICATION_ACCOUNT_TYPE.OWNER
  const deviceUuid = await getDeviceUuid()

  await authenticateSigner(signer, chainIds[0])

  const NOTIFICATIONS_GRANTED = isOwner ? OWNER_NOTIFICATIONS : REGULAR_NOTIFICATIONS

  await getStore()
    .dispatch(
      notificationsApi.endpoints.notificationsUpsertSubscriptionsV2.initiate({
        upsertSubscriptionsDto: {
          cloudMessagingToken: fcmToken,
          safes: chainIds.map((chainId) => ({
            chainId,
            address: safeAddress,
            notificationTypes: NOTIFICATIONS_GRANTED,
          })),
          deviceType: isAndroid ? 'ANDROID' : 'IOS',
          deviceUuid,
        },
      }),
    )
    .unwrap()
}

export const unregisterForNotificationsOnBackEnd = async ({
  signer,
  safeAddress,
  chainIds,
}: {
  signer: Wallet | HDNodeWallet | null
  safeAddress: string
  chainIds: string[]
}) => {
  // Validate input parameters
  if (!chainIds || chainIds.length === 0) {
    Logger.warn('No chainIds provided for unregistering notifications', { safeAddress })
    return
  }

  await authenticateSigner(signer, chainIds[0])
  const deviceUuid = await getDeviceUuid()

  // Ensure we have all required data
  if (!deviceUuid || !safeAddress) {
    throw new Error('Missing required parameters for unregistering notifications')
  }

  // Use the new bulk delete endpoint for better efficiency
  const subscriptions = chainIds.map((chainId) => ({
    chainId: chainId,
    deviceUuid: deviceUuid,
    safeAddress: safeAddress,
  }))

  // Ensure we have valid subscriptions array
  if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
    throw new Error('No valid subscriptions to delete')
  }

  const deleteAllSubscriptionsDto = {
    subscriptions: subscriptions,
  }

  Logger.info('Unregistering notifications for subscriptions', { deleteAllSubscriptionsDto })

  try {
    await getStore()
      .dispatch(
        notificationsApi.endpoints.notificationsDeleteAllSubscriptionsV2.initiate({
          deleteAllSubscriptionsDto,
        }),
      )
      .unwrap()
  } catch (error: unknown) {
    // Treat 404 errors as successful unregistration since the safe was already unsubscribed
    if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
      Logger.info('Safe was already unsubscribed from notifications', { safeAddress, chainIds })
    } else {
      Logger.error('Failed to unregister notifications', { error, safeAddress, chainIds })
      throw error
    }
  }
}
