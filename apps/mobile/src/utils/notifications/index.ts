import { AndroidChannel, AndroidImportance } from '@notifee/react-native'
import { HDNodeWallet, Wallet } from 'ethers'

export enum ChannelId {
  DEFAULT_NOTIFICATION_CHANNEL_ID = 'DEFAULT_NOTIFICATION_CHANNEL_ID',
  ANNOUNCEMENT_NOTIFICATION_CHANNEL_ID = 'ANNOUNCEMENT_NOTIFICATION_CHANNEL_ID',
}

export interface SafeAndroidChannel extends AndroidChannel {
  id: ChannelId
  title: string
  subtitle: string
}

export const notificationChannels = [
  {
    id: ChannelId.DEFAULT_NOTIFICATION_CHANNEL_ID,
    name: 'Transaction Complete',
    lights: true,
    vibration: true,
    importance: AndroidImportance.HIGH,
    title: 'Transaction',
    subtitle: 'Transaction Complete',
  } as SafeAndroidChannel,
  {
    id: ChannelId.ANNOUNCEMENT_NOTIFICATION_CHANNEL_ID,
    name: 'Safe Announcement',
    lights: true,
    vibration: true,
    importance: AndroidImportance.HIGH,
    title: 'Announcement',
    subtitle: 'Safe Announcement',
  } as SafeAndroidChannel,
]

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
  return Promise.race([promise, timeout])
}

export function getSigner(
  safeOwnerPK: string | undefined,
  randomDelegatedAccount: HDNodeWallet,
): Wallet | HDNodeWallet {
  const signerAccount = safeOwnerPK ? new Wallet(safeOwnerPK) : randomDelegatedAccount

  return signerAccount
}
