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
export enum EventCategory {
  SETUP_RECOVERY = 'setup-recovery',
  START_RECOVERY = 'propose-recovery',
  REMOVE_RECOVERY = 'remove-recovery',
  CANCEL_RECOVERY = 'cancel-recovery',
}
