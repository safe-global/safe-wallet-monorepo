import DeviceInfo from 'react-native-device-info'
import { SiweMessage } from 'siwe'
import { Wallet, HDNodeWallet } from 'ethers'

import { store } from '@/src/store'
import { selectSafeInfo } from '@/src/store/safesSlice'
import { selectSigners } from '@/src/store/signersSlice'
import { selectFirstDelegateForAnySafeOwner } from '@/src/store/delegatesSlice'
import { NOTIFICATION_ACCOUNT_TYPE, ERROR_MSG } from '@/src/store/constants'
import {
  notificationChannels,
  withTimeout,
  getSigner,
  REGULAR_NOTIFICATIONS,
  OWNER_NOTIFICATIONS,
} from '@/src/utils/notifications'
import FCMService from './FCMService'
import NotificationService from './NotificationService'
import { cgwClient } from '@safe-global/store/gateway/cgwClient'
import Logger from '@/src/utils/logger'
import { convertToUuid } from '@/src/utils/uuid'
import { isAndroid } from '@/src/config/constants'
import { getPrivateKey } from '@/src/hooks/useSign/useSign'

type DelegateInfo = { owner: string; delegateAddress: string } | null

export const getDelegateKeyId = (safe: string, delegateAddress: string): string =>
  `delegate_${safe}_${delegateAddress}`

export const getDelegateSigner = async (delegate: DelegateInfo) => {
  if (!delegate) return { signer: null as Wallet | HDNodeWallet | null }
  const { owner, delegateAddress } = delegate
  const delegateKeyId = getDelegateKeyId(owner, delegateAddress)
  const privateKey = await getPrivateKey(delegateKeyId, { requireAuthentication: false })
  const signer = privateKey ? getSigner(privateKey) : null
  return { signer }
}

const getDeviceUuid = async () => {
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
  const { nonce } = await store.dispatch(cgwClient.endpoints.authGetNonceV1.initiate()).unwrap()

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

const authenticateSigner = async (signer: Wallet | HDNodeWallet | null, chainId: string) => {
  if (!signer) return
  const { siweMessage } = await getNotificationRegisterPayload({ signer, chainId })
  const signature = await signer.signMessage(siweMessage)
  console.log('store', store, cgwClient)
  await store
    .dispatch(
      cgwClient.endpoints.authVerifyV1.initiate({
        siweDto: { message: siweMessage, signature },
      }),
    )
    .unwrap()
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

  console.log('cgwClient', cgwClient, store)
  await store
    .dispatch(
      cgwClient.endpoints.notificationsUpsertSubscriptionsV2.initiate({
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
    await store
      .dispatch(
        cgwClient.endpoints.notificationsDeleteSubscriptionV2.initiate({
          deviceUuid,
          chainId,
          safeAddress,
        }),
      )
      .unwrap()
    await withTimeout(Promise.resolve(), 200)
  }
}

export const getNotificationAccountType = (safeAddress: string) => {
  const state = store.getState()
  const safeInfoItem = selectSafeInfo(state, safeAddress as `0x${string}`)
  if (!safeInfoItem) {
    return { ownerFound: null, accountType: NOTIFICATION_ACCOUNT_TYPE.REGULAR }
  }

  const owners = safeInfoItem.SafeInfo.owners
  const signers = selectSigners(state)
  const ownerFound = owners.find((owner) => signers[owner.value]) ?? null

  return {
    ownerFound,
    accountType: ownerFound ? NOTIFICATION_ACCOUNT_TYPE.OWNER : NOTIFICATION_ACCOUNT_TYPE.REGULAR,
  }
}

export async function registerSafe(address: string, chainIds: string[]): Promise<void> {
  try {
    Logger.info('registerSafe ::', { address, chainIds })

    const delegate = selectFirstDelegateForAnySafeOwner(store.getState(), address as `0x${string}`)
    const { signer } = await getDelegateSigner(delegate)
    const { accountType } = getNotificationAccountType(address)

    const fcmToken = await FCMService.initNotification()
    await withTimeout(NotificationService.createChannel(notificationChannels[0]), 5000)

    await registerForNotificationsOnBackEnd({
      safeAddress: address,
      signer,
      chainIds,
      fcmToken: fcmToken || '',
      notificationAccountType: accountType,
    })
  } catch (err) {
    Logger.error('registerSafe failed', err)
  }
}

export async function unregisterSafe(address: string, chainIds: string[]): Promise<void> {
  try {
    Logger.info('unregisterSafe ::', { address, chainIds })

    const delegate = selectFirstDelegateForAnySafeOwner(store.getState(), address as `0x${string}`)
    const { signer } = await getDelegateSigner(delegate)

    await unregisterForNotificationsOnBackEnd({ signer, safeAddress: address, chainIds })
  } catch (err) {
    Logger.error('unregisterSafe failed', err)
  }
}