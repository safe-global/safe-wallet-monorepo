import type {
  Transaction,
  TransferTransactionInfo,
  SettingsChangeTransaction,
  CustomTransactionInfo,
  SwapTransferTransactionInfo,
} from './types'
import type { AnalyticsLabel, TransactionInfoType } from './types'
import { ANALYTICS_LABELS } from './constants'

export const getTransactionAnalyticsLabel = (txInfo: Transaction['txInfo']): AnalyticsLabel => {
  const baseType = txInfo.type as TransactionInfoType

  switch (baseType) {
    case 'Transfer': {
      const transferTx = txInfo as TransferTransactionInfo
      return ANALYTICS_LABELS.TRANSFER_TYPES[transferTx.transferInfo.type]
    }

    case 'SwapTransfer': {
      const swapTransferTx = txInfo as SwapTransferTransactionInfo
      return ANALYTICS_LABELS.TRANSFER_TYPES[swapTransferTx.transferInfo.type]
    }

    case 'SettingsChange': {
      const settingsTx = txInfo as SettingsChangeTransaction
      return ANALYTICS_LABELS.SETTINGS_TYPES[settingsTx.settingsInfo.type]
    }

    case 'Custom': {
      const customTx = txInfo as CustomTransactionInfo

      if (customTx.isCancellation) {
        return ANALYTICS_LABELS.ENHANCED.rejection
      }

      if (customTx.actionCount && customTx.actionCount > 1) {
        return ANALYTICS_LABELS.ENHANCED.batch
      }

      return ANALYTICS_LABELS.BASE_TYPES.Custom
    }

    default: {
      return ANALYTICS_LABELS.BASE_TYPES[baseType]
    }
  }
}
