import type {
  Transaction,
  TransferTransactionInfo,
  SettingsChangeTransaction,
  CustomTransactionInfo,
  SwapTransferTransactionInfo,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

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

// 🚀 Extract precise types from the source of truth
export type TransactionInfoType = Transaction['txInfo']['type']
export type TransferInfoType = TransferTransactionInfo['transferInfo']['type']
export type SettingsInfoType = SettingsChangeTransaction['settingsInfo']['type']

// 🎯 Type-safe analytics labels that auto-sync with gateway types
export const ANALYTICS_LABELS = {
  // Base transaction types
  BASE_TYPES: {
    Creation: 'safe_creation',
    Custom: 'custom',
    Transfer: 'transfer',
    SettingsChange: 'settings_change',
    SwapOrder: 'swap_order',
    SwapTransfer: 'swap_transfer',
    TwapOrder: 'twap_order',
    NativeStakingDeposit: 'native_staking_deposit',
    NativeStakingValidatorsExit: 'native_staking_exit',
    NativeStakingWithdraw: 'native_staking_withdraw',
    VaultDeposit: 'vault_deposit',
    VaultRedeem: 'vault_redeem',
  } as const satisfies Record<TransactionInfoType, string>,

  // Transfer sub-types (from transferInfo.type)
  TRANSFER_TYPES: {
    ERC20: 'transfer_token',
    ERC721: 'transfer_nft',
    NATIVE_COIN: 'transfer_native',
  } as const satisfies Record<TransferInfoType, string>,

  // Settings change sub-types (from settingsInfo.type)
  SETTINGS_TYPES: {
    ADD_OWNER: 'owner_add',
    REMOVE_OWNER: 'owner_remove',
    SWAP_OWNER: 'owner_swap',
    CHANGE_THRESHOLD: 'owner_threshold_change',
    DELETE_GUARD: 'guard_remove',
    DISABLE_MODULE: 'module_remove',
    ENABLE_MODULE: 'module_enable',
    SET_FALLBACK_HANDLER: 'fallback_handler_set',
    SET_GUARD: 'guard_set',
    CHANGE_MASTER_COPY: 'safe_update',
  } as const satisfies Record<SettingsInfoType, string>,

  // Enhanced analytics labels for edge cases
  ENHANCED: {
    batch_transfer_token: 'batch_transfer_token',
    batch: 'batch',
    rejection: 'rejection',
    typed_message: 'typed_message',
    safeapps: 'safeapps',
    walletconnect: 'walletconnect',
    activate_without_tx: 'activate_without_tx',
    activate_with_tx: 'activate_with_tx',
  } as const,
} as const

// 🎨 Union of all possible analytics labels
export type AnalyticsLabel =
  | (typeof ANALYTICS_LABELS.BASE_TYPES)[TransactionInfoType]
  | (typeof ANALYTICS_LABELS.TRANSFER_TYPES)[TransferInfoType]
  | (typeof ANALYTICS_LABELS.SETTINGS_TYPES)[SettingsInfoType]
  | (typeof ANALYTICS_LABELS.ENHANCED)[keyof typeof ANALYTICS_LABELS.ENHANCED]

/**
 * 🚀 Precise transaction-to-analytics mapper
 * Leverages exact nested type structures from @safe-global/store
 */
export const getTransactionAnalyticsLabel = (txInfo: Transaction['txInfo']): AnalyticsLabel => {
  const baseType = txInfo.type as TransactionInfoType

  switch (baseType) {
    case 'Transfer': {
      const transferTx = txInfo as TransferTransactionInfo
      // Use the exact transferInfo.type from the gateway
      return ANALYTICS_LABELS.TRANSFER_TYPES[transferTx.transferInfo.type]
    }

    case 'SwapTransfer': {
      const swapTransferTx = txInfo as SwapTransferTransactionInfo
      // SwapTransfer also has transferInfo, so we can determine the underlying asset type
      return ANALYTICS_LABELS.TRANSFER_TYPES[swapTransferTx.transferInfo.type]
    }

    case 'SettingsChange': {
      const settingsTx = txInfo as SettingsChangeTransaction
      // Use the exact settingsInfo.type from the gateway
      return ANALYTICS_LABELS.SETTINGS_TYPES[settingsTx.settingsInfo.type]
    }

    case 'Custom': {
      const customTx = txInfo as CustomTransactionInfo

      // Handle specific custom transaction cases
      if (customTx.isCancellation) {
        return ANALYTICS_LABELS.ENHANCED.rejection
      }

      if (customTx.actionCount && customTx.actionCount > 1) {
        return ANALYTICS_LABELS.ENHANCED.batch
      }

      // Default to base custom type
      return ANALYTICS_LABELS.BASE_TYPES.Custom
    }

    default: {
      // All other transaction types use their base mapping
      return ANALYTICS_LABELS.BASE_TYPES[baseType]
    }
  }
}
