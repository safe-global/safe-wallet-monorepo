import { AndroidChannel, AndroidImportance, AndroidVisibility } from '@notifee/react-native'
import { NotificationType } from '@safe-global/store/gateway/AUTO_GENERATED/notifications'
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
    visibility: AndroidVisibility.PUBLIC,
    title: 'Transaction',
    subtitle: 'Transaction Complete',
  } as SafeAndroidChannel,
  {
    id: ChannelId.ANNOUNCEMENT_NOTIFICATION_CHANNEL_ID,
    name: 'Safe Announcement',
    lights: true,
    vibration: true,
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    title: 'Announcement',
    subtitle: 'Safe Announcement',
  } as SafeAndroidChannel,
]

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
  return Promise.race([promise, timeout])
}

export function getSigner(signerPK: string): Wallet | HDNodeWallet {
  const signerAccount = new Wallet(signerPK)

  return signerAccount
}

export const REGULAR_NOTIFICATIONS: NotificationType[] = [
  'DELETED_MULTISIG_TRANSACTION',
  'INCOMING_ETHER',
  'INCOMING_TOKEN',
  'MODULE_TRANSACTION',
  'EXECUTED_MULTISIG_TRANSACTION',
]
export const OWNER_NOTIFICATIONS: NotificationType[] = [
  ...REGULAR_NOTIFICATIONS,
  'MESSAGE_CONFIRMATION_REQUEST',
  'CONFIRMATION_REQUEST',
]
