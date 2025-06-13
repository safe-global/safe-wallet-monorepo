import type {
  Transaction,
  TransferTransactionInfo,
  SettingsChangeTransaction,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
export type {
  Transaction,
  TransferTransactionInfo,
  SettingsChangeTransaction,
  CustomTransactionInfo,
  SwapTransferTransactionInfo,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { ANALYTICS_LABELS } from './constants'

/**
 * Firebase Analytics Event Types
 * These event names are passed directly to Firebase Analytics
 */
export enum EventType {
  SCREEN_VIEW = 'screen_view',
  CLICK = 'customClick',
  META = 'metadata',
  SAFE_APP = 'safeApp',
  SAFE_CREATED = 'safe_created',
  SAFE_ACTIVATED = 'safe_activated',
  SAFE_OPENED = 'safe_opened',
  WALLET_CONNECTED = 'wallet_connected',
  TX_CREATED = 'tx_created',
  TX_CONFIRMED = 'tx_confirmed',
  TX_EXECUTED = 'tx_executed',
}

export type EventLabel = string | number | boolean | null

export type AnalyticsEvent = {
  eventName: string
  eventCategory: string
  eventAction: string
  eventLabel?: EventLabel
  chainId?: string
}

export enum AnalyticsUserProperties {
  WALLET_LABEL = 'walletLabel',
  WALLET_ADDRESS = 'walletAddress',
}

// Extract precise types from the source of truth
export type TransactionInfoType = Transaction['txInfo']['type']
export type TransferInfoType = TransferTransactionInfo['transferInfo']['type']
export type SettingsInfoType = SettingsChangeTransaction['settingsInfo']['type']

// Union of all possible analytics labels
export type AnalyticsLabel =
  | (typeof ANALYTICS_LABELS.BASE_TYPES)[TransactionInfoType]
  | (typeof ANALYTICS_LABELS.TRANSFER_TYPES)[TransferInfoType]
  | (typeof ANALYTICS_LABELS.SETTINGS_TYPES)[SettingsInfoType]
  | (typeof ANALYTICS_LABELS.ENHANCED)[keyof typeof ANALYTICS_LABELS.ENHANCED]
