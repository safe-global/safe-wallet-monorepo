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
  SIGNERS_STRUCTURE = 'signers-structure',
  START_RECOVERY = 'propose-recovery',
  TOKEN_TRANSFER = 'token-transfer',
  UPDATE_SAFE = 'update-safe',
}

/**
 * MixPanel User Attributes for Safe Wallet
 *
 * These attributes are used for cohort analysis and user segmentation
 */
export interface SafeUserAttributes {
  /** On-chain address of the Safe (Primary key for cohort analysis) */
  safe_id: string

  /** Timestamp when the Safe was deployed (Life of user) */
  created_at: Date

  /** Each version has different properties (Filter out older Safes) */
  safe_version: string

  /** Total number of wallet addresses/signers on this Safe (Engagement metric) */
  num_signers: number

  /** Number of signatures required to execute a transaction (Setup intent) */
  threshold: number

  /** Blockchain networks (Context for segmentation) */
  networks: string[]

  /** Timestamp of most recent transaction (Churn alerting) */
  last_tx_at: Date | null

  /** ID of parent Space if the Safe is grouped in a Space (Space-level grouping) */
  space_id: string | null

  /** Array of child Safe IDs that this Safe contains (Nested safes grouping) */
  nested_safe_ids: string[]

  /** Lifetime number of transactions executed by this Safe (Engagement metric) */
  total_tx_count: number
}

/**
 * MixPanel User Profile Update payload
 */
export interface MixPanelUserProfileUpdate {
  $set?: Partial<SafeUserAttributes>
  $set_once?: Partial<SafeUserAttributes>
  $add?: Partial<Pick<SafeUserAttributes, 'total_tx_count'>>
  $append?: Partial<Pick<SafeUserAttributes, 'networks' | 'nested_safe_ids'>>
  $union?: Partial<Pick<SafeUserAttributes, 'networks' | 'nested_safe_ids'>>
}

/**
 * Event tracking types for MixPanel with humanized property names
 */
export interface SafeEventProperties {
  'Safe Address': string
  'Safe Version': string
  Network: string
  [key: string]: any
}
