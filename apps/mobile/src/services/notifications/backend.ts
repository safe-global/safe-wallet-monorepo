import DeviceInfo from 'react-native-device-info'
import { SiweMessage } from 'siwe'
import { Wallet, HDNodeWallet } from 'ethers'

import { NOTIFICATION_ACCOUNT_TYPE, ERROR_MSG } from '@/src/store/constants'
import { withTimeout, REGULAR_NOTIFICATIONS, OWNER_NOTIFICATIONS } from '@/src/utils/notifications'
import { cgwApi as authApi } from '@safe-global/store/gateway/AUTO_GENERATED/auth'
import { cgwApi as notificationsApi } from '@safe-global/store/gateway/AUTO_GENERATED/notifications'
import { convertToUuid } from '@/src/utils/uuid'
import { isAndroid } from '@/src/config/constants'
import Logger from '@/src/utils/logger'
import { getStore } from '@/src/store/utils/singletonStore'

const AUTH_CACHE_EXPIRY_MS = 60000 // 60 seconds

type AuthCacheEntry = {
  timestamp: number
  chainId: string
}

let authCache: Record<string, AuthCacheEntry> = {}

// This is only used in testing as it turned mega hard to do jest.resetModules()
export function clearAuthCache() {
  authCache = {}
}

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
  const { nonce } = await getStore()
    .dispatch(
      authApi.endpoints.authGetNonceV1.initiate(undefined, {
        // don't use cached nonce
        forceRefetch: true,
      }),
    )
    .unwrap()

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
  const cacheKey = `${signerAddress.toLowerCase()}`
  const cachedAuth = authCache[cacheKey]

  const now = Date.now()
  if (cachedAuth && cachedAuth.chainId === chainId && now - cachedAuth.timestamp < AUTH_CACHE_EXPIRY_MS) {
    Logger.info('Using cached authentication for signer', { signerAddress })
    return
  }

  const { siweMessage } = await getNotificationRegisterPayload({ signer, chainId })
  const signature = await signer.signMessage(siweMessage)

  await getStore()
    .dispatch(
      authApi.endpoints.authVerifyV1.initiate({
        siweDto: { message: siweMessage, signature },
      }),
    )
    .unwrap()

  authCache[cacheKey] = {
    timestamp: now,
    chainId,
  }
  Logger.info('Authenticated signer and updated cache', { signerAddress })
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
  await authenticateSigner(signer, chainIds[0])
  const deviceUuid = await getDeviceUuid()

  for (const chainId of chainIds) {
    await getStore()
      .dispatch(
        notificationsApi.endpoints.notificationsDeleteSubscriptionV2.initiate({
          deviceUuid,
          chainId,
          safeAddress,
        }),
      )
      .unwrap()
    await withTimeout(Promise.resolve(), 200)
  }
}
