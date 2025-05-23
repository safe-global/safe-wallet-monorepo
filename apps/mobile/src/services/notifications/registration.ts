import { Wallet, HDNodeWallet } from 'ethers'

import { store } from '@/src/store'
import { selectSafeInfo } from '@/src/store/safesSlice'
import { selectSigners } from '@/src/store/signersSlice'
import { selectFirstDelegateForAnySafeOwner } from '@/src/store/delegatesSlice'
import { NOTIFICATION_ACCOUNT_TYPE } from '@/src/store/constants'
import { notificationChannels, withTimeout, getSigner } from '@/src/utils/notifications'
import FCMService from './FCMService'
import NotificationService from './NotificationService'
import { setSafeSubscriptionStatus } from '@/src/store/safeSubscriptionsSlice'
import Logger from '@/src/utils/logger'
import { getPrivateKey } from '@/src/hooks/useSign/useSign'
import { registerForNotificationsOnBackEnd, unregisterForNotificationsOnBackEnd } from './backend'
import { getDelegateKeyId } from '@/src/utils/delegate'

type DelegateInfo = { owner: string; delegateAddress: string } | null

// Cache to track authenticated signers and their authentication timestamps

export const getDelegateSigner = async (delegate: DelegateInfo) => {
  if (!delegate) {
    return { signer: null as Wallet | HDNodeWallet | null }
  }
  const { owner, delegateAddress } = delegate
  const delegateKeyId = getDelegateKeyId(owner, delegateAddress)
  const privateKey = await getPrivateKey(delegateKeyId, { requireAuthentication: false })
  const signer = privateKey ? getSigner(privateKey) : null
  return { signer }
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

    chainIds.forEach((chainId) =>
      store.dispatch(setSafeSubscriptionStatus({ safeAddress: address, chainId, subscribed: true })),
    )
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

    chainIds.forEach((chainId) =>
      store.dispatch(setSafeSubscriptionStatus({ safeAddress: address, chainId, subscribed: false })),
    )
  } catch (err) {
    Logger.error('unregisterSafe failed', err)
  }
}
