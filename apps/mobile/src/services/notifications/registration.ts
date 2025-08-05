import { Wallet, HDNodeWallet } from 'ethers'

import type { Store } from '@reduxjs/toolkit'
import type { RootState } from '@/src/store'

type StoreLike = Pick<Store<RootState>, 'dispatch' | 'getState'>
import { selectSafeInfo } from '@/src/store/safesSlice'
import { selectSigners } from '@/src/store/signersSlice'
import { selectAllDelegatesForSafeOwners, selectFirstDelegateForAnySafeOwner } from '@/src/store/delegatesSlice'
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
    const allDelegates = selectAllDelegatesForSafeOwners(store.getState(), address as `0x${string}`)
    const { accountType } = getNotificationAccountType(address)

    const fcmToken = await FCMService.initNotification()
    await withTimeout(NotificationService.createChannel(notificationChannels[0]), 5000)

    // If no delegates found, try to register without a signer (for owner-based notifications)
    if (allDelegates.length === 0) {
      Logger.warn(`No delegates found for Safe ${address}, registering without delegate signer`)
      await registerForNotificationsOnBackEnd({
        safeAddress: address,
        signer: null,
        chainIds,
        fcmToken: fcmToken || '',
        notificationAccountType: accountType,
      })
    } else {
      // Register each delegate for notifications
      const registrationPromises = allDelegates.map(async (delegate) => {
        try {
          const { signer } = await getDelegateSigner(delegate)
          await registerForNotificationsOnBackEnd({
            safeAddress: address,
            signer,
            chainIds,
            fcmToken: fcmToken || '',
            notificationAccountType: accountType,
          })
          Logger.info(`Successfully registered delegate ${delegate.delegateAddress} for Safe ${address}`)
        } catch (err) {
          Logger.error(`Failed to register delegate ${delegate.delegateAddress} for Safe ${address}`, err)
          // Don't throw here - we want to continue with other delegates
        }
      })

      // Wait for all registrations to complete
      await Promise.allSettled(registrationPromises)
    }

    // Update subscription status for all chains
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
