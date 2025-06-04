import { Wallet, HDNodeWallet } from 'ethers'

import type { Store } from '@reduxjs/toolkit'
import type { RootState } from '@/src/store'

type StoreLike = Pick<Store<RootState>, 'dispatch' | 'getState'>
import { selectSafeInfo } from '@/src/store/safesSlice'
import { selectSigners } from '@/src/store/signersSlice'
import { selectFirstDelegateForAnySafeOwner } from '@/src/store/delegatesSlice'
import { notificationChannels, withTimeout, getSigner } from '@/src/utils/notifications'
import { getAccountType } from '@/src/utils/notifications/accountType'
import FCMService from './FCMService'
import NotificationService from './NotificationService'
import { setSafeSubscriptionStatus } from '@/src/store/safeSubscriptionsSlice'
import Logger from '@/src/utils/logger'
import { getPrivateKey } from '@/src/hooks/useSign/useSign'
import { registerForNotificationsOnBackEnd, unregisterForNotificationsOnBackEnd } from './backend'
import { getDelegateKeyId } from '@/src/utils/delegate'
import { getStore } from '@/src/store/utils/singletonStore'

type DelegateInfo = { owner: string; delegateAddress: string } | null

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
  const state = getStore().getState()
  const safeInfoItem = selectSafeInfo(state, safeAddress as `0x${string}`)
  const signers = selectSigners(state)
  return getAccountType(safeInfoItem?.SafeInfo, signers)
}

export async function registerSafe(store: StoreLike, address: string, chainIds: string[]): Promise<void> {
  try {
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

export async function unregisterSafe(store: StoreLike, address: string, chainIds: string[]): Promise<void> {
  try {
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
