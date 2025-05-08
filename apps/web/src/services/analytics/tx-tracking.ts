import { TX_TYPES } from '@/services/analytics/events/transactions'
import { SettingsInfoType, type TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import {
  isERC721Transfer,
  isMultiSendTxInfo,
  isSettingsChangeTxInfo,
  isTransferTxInfo,
  isCustomTxInfo,
  isCancellationTxInfo,
  isSwapOrderTxInfo,
  isAnyStakingTxInfo,
  isNestedConfirmationTxInfo,
} from '@/utils/transaction-guards'
import { BRIDGE_WIDGET_URL } from '@/features/bridge/components/BridgeWidget'
import { SWAP_WIDGET_URL } from '@/features/swap/components/FallbackSwapWidget'
export const getTransactionTrackingType = (
  details: TransactionDetails | undefined,
  origin?: string,
  isMassPayout?: boolean,
): string => {
  if (isMassPayout) {
    return TX_TYPES.batch_transfer_token
  }

  if (!details) {
    return TX_TYPES.custom
  }

  const { txInfo } = details

  const isNativeBridge = origin?.includes(BRIDGE_WIDGET_URL)
  const isLiFiSwap = origin?.includes(SWAP_WIDGET_URL)

  if (isNativeBridge) {
    return TX_TYPES.native_bridge
  }

  if (isLiFiSwap) {
    return TX_TYPES.native_swap_lifi
  }

  if (isTransferTxInfo(txInfo)) {
    if (isERC721Transfer(txInfo.transferInfo)) {
      return TX_TYPES.transfer_nft
    }
    return TX_TYPES.transfer_token
  }

  if (isSwapOrderTxInfo(txInfo)) {
    return TX_TYPES.native_swap
  }

  if (isAnyStakingTxInfo(txInfo)) {
    return txInfo.type
  }

  if (isSettingsChangeTxInfo(txInfo)) {
    switch (txInfo.settingsInfo?.type) {
      case SettingsInfoType.ADD_OWNER: {
        return TX_TYPES.owner_add
      }
      case SettingsInfoType.REMOVE_OWNER: {
        return TX_TYPES.owner_remove
      }
      case SettingsInfoType.SWAP_OWNER: {
        return TX_TYPES.owner_swap
      }
      case SettingsInfoType.CHANGE_THRESHOLD: {
        return TX_TYPES.owner_threshold_change
      }
      case SettingsInfoType.DISABLE_MODULE: {
        return TX_TYPES.module_remove
      }
      case SettingsInfoType.DELETE_GUARD: {
        return TX_TYPES.guard_remove
      }
    }
  }

  if (isCustomTxInfo(txInfo)) {
    if (isCancellationTxInfo(txInfo)) {
      return TX_TYPES.rejection
    }

    if (details.safeAppInfo) {
      return details.safeAppInfo.url
    }

    if (isMultiSendTxInfo(txInfo)) {
      return TX_TYPES.batch
    }

    if (isNestedConfirmationTxInfo(txInfo)) {
      return TX_TYPES.nested_safe
    }

    return TX_TYPES.walletconnect
  }

  return TX_TYPES.custom
}
