/**
 * These event names are passed straight to GTM
 */
export enum EventType {
  PAGEVIEW = 'pageview',
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
  event?: EventType
  category: string
  action: string
  label?: EventLabel
  chainId?: string
}

export type SafeAppSDKEvent = {
  method: string
  ethMethod: string
  version: string
}

export enum DeviceType {
  DESKTOP = 'desktop',
  MOBILE = 'mobile',
  TABLET = 'tablet',
}

export enum AnalyticsUserProperties {
  WALLET_LABEL = 'walletLabel',
  WALLET_ADDRESS = 'walletAddress',
}

// These are used for the generic stepper flow events (Next, Back)
export enum TxFlowType {
  ADD_OWNER = 'add-owner',
  CANCEL_RECOVERY = 'cancel-recovery',
  CHANGE_THRESHOLD = 'change-threshold',
  CONFIRM_BATCH = 'confirm-batch',
  CONFIRM_TX = 'confirm-tx',
  NFT_TRANSFER = 'nft-transfer',
  REJECT_TX = 'reject-tx',
  REMOVE_GUARD = 'remove-guard',
  REMOVE_MODULE = 'remove-module',
  REMOVE_OWNER = 'remove-owner',
  REMOVE_RECOVERY = 'remove-recovery',
  REMOVE_SPENDING_LIMIT = 'remove-spending-limit',
  REPLACE_OWNER = 'replace-owner',
  SAFE_APPS_TX = 'safe-apps-tx',
  SETUP_RECOVERY = 'setup-recovery',
  SETUP_SPENDING_LIMIT = 'setup-spending-limit',
  SIGN_MESSAGE_ON_CHAIN = 'sign-message-on-chain',
  START_RECOVERY = 'propose-recovery',
  TOKEN_TRANSFER = 'token-transfer',
  UPDATE_SAFE = 'update-safe',
}
