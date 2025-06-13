import type { TransactionInfoType, TransferInfoType, SettingsInfoType } from './types'

export const ANALYTICS_LABELS = {
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

  TRANSFER_TYPES: {
    ERC20: 'transfer_token',
    ERC721: 'transfer_nft',
    NATIVE_COIN: 'transfer_native',
  } as const satisfies Record<TransferInfoType, string>,

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
