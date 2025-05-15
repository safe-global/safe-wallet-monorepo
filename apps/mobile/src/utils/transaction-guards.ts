import uniq from 'lodash/uniq'
import {
  type Cancellation,
  type MultiSend,
  ConflictType,
  DetailedExecutionInfoType,
  TransactionInfoType,
  TransactionListItemType,
  TransactionTokenType,
  TransferDirection,
} from '@safe-global/store/gateway/types'

import type {
  ModuleExecutionInfo,
  TransactionDetails,
  SwapTransferTransactionInfo,
  TwapOrderTransactionInfo,
  ConflictHeaderQueuedItem,
  TransactionQueuedItem,
  DateLabel,
  TransferTransactionInfo,
  SettingsChangeTransaction,
  LabelQueuedItem,
  MultisigExecutionInfo,
  SwapOrderTransactionInfo,
  Erc20Transfer,
  Erc721Transfer,
  NativeCoinTransfer,
  Transaction,
  CreationTransactionInfo,
  CustomTransactionInfo,
  MultisigExecutionDetails,
  NativeStakingDepositTransactionInfo,
  NativeStakingValidatorsExitTransactionInfo,
  NativeStakingWithdrawTransactionInfo,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

import { HistoryTransactionItems, PendingTransactionItems } from '@safe-global/store/gateway/types'

type TransactionInfo = Transaction['txInfo']

const TransactionStatus = {
  AWAITING_CONFIRMATIONS: 'AWAITING_CONFIRMATIONS',
  AWAITING_EXECUTION: 'AWAITING_EXECUTION',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED',
  SUCCESS: 'SUCCESS',
}

export const isTxQueued = (value: Transaction['txStatus']): boolean => {
  return [TransactionStatus.AWAITING_CONFIRMATIONS as string, TransactionStatus.AWAITING_EXECUTION as string].includes(
    value,
  )
}

export const isMultisigDetailedExecutionInfo = (
  value?: TransactionDetails['detailedExecutionInfo'],
): value is MultisigExecutionDetails => {
  return value?.type === DetailedExecutionInfoType.MULTISIG
}

export const getBulkGroupTxHash = (group: PendingTransactionItems[]) => {
  const hashList = group.map((item) => {
    if (isTransactionListItem(item)) {
      return item.transaction.txHash
    }
    return null
  })
  return uniq(hashList).length === 1 ? hashList[0] : undefined
}

export const isArrayParameter = (parameter: string): boolean => /(\[\d*?])+$/.test(parameter)
export const getTxHash = (item: TransactionQueuedItem): string => item.transaction.txHash as unknown as string

export const isTransferTxInfo = (value: Transaction['txInfo']): value is TransferTransactionInfo => {
  return value.type === TransactionInfoType.TRANSFER || isSwapTransferOrderTxInfo(value)
}

export const isSettingsChangeTxInfo = (value: Transaction['txInfo']): value is SettingsChangeTransaction => {
  return value.type === TransactionInfoType.SETTINGS_CHANGE
}

export const isAddSignerTxInfo = (value: Transaction['txInfo']): value is SettingsChangeTransaction => {
  return isSettingsChangeTxInfo(value) && value.settingsInfo?.type === 'ADD_OWNER'
}

export const isRemoveSignerTxInfo = (value: Transaction['txInfo']): value is SettingsChangeTransaction => {
  return isSettingsChangeTxInfo(value) && value.settingsInfo?.type === 'REMOVE_OWNER'
}

/**
 * A fulfillment transaction for swap, limit or twap order is always a SwapOrder
 * It cannot be a TWAP order
 *
 * @param value
 */
export const isSwapTransferOrderTxInfo = (value: Transaction['txInfo']): value is SwapTransferTransactionInfo => {
  return value.type === TransactionInfoType.SWAP_TRANSFER
}

export const isOutgoingTransfer = (txInfo: Transaction['txInfo']): boolean => {
  return isTransferTxInfo(txInfo) && txInfo.direction.toUpperCase() === TransferDirection.OUTGOING
}

export const isCustomTxInfo = (value: Transaction['txInfo']): value is CustomTransactionInfo => {
  return value.type === TransactionInfoType.CUSTOM
}

export const isChangeThresholdTxInfo = (value: Transaction['txInfo']): value is SettingsChangeTransaction => {
  return value.type === TransactionInfoType.SETTINGS_CHANGE && value.settingsInfo?.type === 'CHANGE_THRESHOLD'
}

export const isMultiSendTxInfo = (value: Transaction['txInfo']): value is MultiSend => {
  return (
    value.type === TransactionInfoType.CUSTOM &&
    value.methodName === 'multiSend' &&
    typeof value.actionCount === 'number'
  )
}

export const isSwapOrderTxInfo = (value: TransactionInfo): value is SwapOrderTransactionInfo => {
  return value.type === TransactionInfoType.SWAP_ORDER
}
export const isTwapOrderTxInfo = (value: Transaction['txInfo']): value is TwapOrderTransactionInfo => {
  return value.type === TransactionInfoType.TWAP_ORDER
}

export const isOrderTxInfo = (value: Transaction['txInfo']): value is SwapOrderTransactionInfo => {
  return isSwapOrderTxInfo(value) || isTwapOrderTxInfo(value)
}

export const isCancellationTxInfo = (value: Transaction['txInfo']): value is Cancellation => {
  return isCustomTxInfo(value) && value.isCancellation
}

export const isStakingTxDepositInfo = (value: Transaction['txInfo']): value is NativeStakingDepositTransactionInfo => {
  return value.type === TransactionInfoType.NATIVE_STAKING_DEPOSIT
}

export const isStakingTxExitInfo = (
  value: Transaction['txInfo'],
): value is NativeStakingValidatorsExitTransactionInfo => {
  return value.type === TransactionInfoType.NATIVE_STAKING_VALIDATORS_EXIT
}

export const isStakingTxWithdrawInfo = (
  value: Transaction['txInfo'],
): value is NativeStakingWithdrawTransactionInfo => {
  return value.type === TransactionInfoType.NATIVE_STAKING_WITHDRAW
}

export const isTransactionListItem = (
  value: HistoryTransactionItems | PendingTransactionItems,
): value is TransactionQueuedItem => {
  return value.type === TransactionListItemType.TRANSACTION
}

export const isConflictHeaderListItem = (value: PendingTransactionItems): value is ConflictHeaderQueuedItem => {
  return value.type === TransactionListItemType.CONFLICT_HEADER
}

export const isNoneConflictType = (transaction: TransactionQueuedItem) => {
  return transaction.conflictType === ConflictType.NONE
}

export const isDateLabel = (value: HistoryTransactionItems | PendingTransactionItems): value is DateLabel => {
  return value.type === TransactionListItemType.DATE_LABEL
}

export const isLabelListItem = (value: PendingTransactionItems | DateLabel): value is LabelQueuedItem => {
  return value.type === TransactionListItemType.LABEL
}

export const isCreationTxInfo = (value: TransactionInfo): value is CreationTransactionInfo => {
  return value.type === TransactionInfoType.CREATION
}

export const isMultisigExecutionInfo = (
  value?: Transaction['executionInfo'] | TransactionDetails['detailedExecutionInfo'],
): value is MultisigExecutionInfo => {
  return value?.type === 'MULTISIG'
}

export const isModuleExecutionInfo = (
  value?: Transaction['executionInfo'] | TransactionDetails['detailedExecutionInfo'],
): value is ModuleExecutionInfo => value?.type === 'MODULE'

export const isNativeTokenTransfer = (value: TransferTransactionInfo['transferInfo']): value is NativeCoinTransfer => {
  return value.type === TransactionTokenType.NATIVE_COIN
}

export const isERC20Transfer = (value: TransferTransactionInfo['transferInfo']): value is Erc20Transfer => {
  return value.type === TransactionTokenType.ERC20
}

export const isERC721Transfer = (value: TransferTransactionInfo['transferInfo']): value is Erc721Transfer => {
  return value.type === TransactionTokenType.ERC721
}
