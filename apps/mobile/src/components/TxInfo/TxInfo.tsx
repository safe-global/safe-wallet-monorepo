import React, { useCallback } from 'react'
import { TransactionInfoType } from '@safe-global/store/gateway/types'
import { type Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useTransactionType } from '@/src/hooks/useTransactionType'
import { TxTokenCard } from '@/src/components/transactions-list/Card/TxTokenCard'
import { TxSettingsCard } from '@/src/components/transactions-list/Card/TxSettingsCard'
import {
  isCancellationTxInfo,
  isCreationTxInfo,
  isCustomTxInfo,
  isMultiSendTxInfo,
  isSettingsChangeTxInfo,
  isSwapOrderTxInfo,
  isTransferTxInfo,
} from '@/src/utils/transaction-guards'
import { TxBatchCard } from '@/src/components/transactions-list/Card/TxBatchCard'
import { TxSafeAppCard } from '@/src/components/transactions-list/Card/TxSafeAppCard'
import { TxRejectionCard } from '@/src/components/transactions-list/Card/TxRejectionCard'
import { TxContractInteractionCard } from '@/src/components/transactions-list/Card/TxContractInteractionCard'
import { TxSwapCard } from '@/src/components/transactions-list/Card/TxSwapCard'
import { TxCreationCard } from '@/src/components/transactions-list/Card/TxCreationCard'
import { TxCardPress } from './types'

interface TxInfoProps {
  tx: Transaction
  bordered?: boolean
  inQueue?: boolean
  onPress?: (tx: TxCardPress) => void
}

function TxInfoComponent({ tx, bordered, inQueue, onPress }: TxInfoProps) {
  const txType = useTransactionType(tx)
  const txInfo = tx.txInfo

  const onCardPress = useCallback(() => {
    if (onPress) {
      onPress({
        tx,
        type: txType,
      })
    }
  }, [onPress, tx, txType])

  if (isTransferTxInfo(txInfo)) {
    return (
      <TxTokenCard
        executionInfo={tx.executionInfo}
        inQueue={inQueue}
        bordered={bordered}
        txInfo={txInfo}
        txStatus={tx.txStatus}
        onPress={onCardPress}
      />
    )
  }

  if (isSettingsChangeTxInfo(txInfo)) {
    return (
      <TxSettingsCard
        onPress={onCardPress}
        executionInfo={tx.executionInfo}
        inQueue={inQueue}
        bordered={bordered}
        txInfo={txInfo}
      />
    )
  }

  if (isMultiSendTxInfo(txInfo) && tx.txInfo.type === TransactionInfoType.CUSTOM) {
    return (
      <TxBatchCard
        executionInfo={tx.executionInfo}
        inQueue={inQueue}
        label={txType.text}
        onPress={onCardPress}
        bordered={bordered}
        txInfo={txInfo}
      />
    )
  }

  if (isMultiSendTxInfo(txInfo) && tx.safeAppInfo) {
    return (
      <TxSafeAppCard
        executionInfo={tx.executionInfo}
        inQueue={inQueue}
        onPress={onCardPress}
        bordered={bordered}
        txInfo={txInfo}
        safeAppInfo={tx.safeAppInfo}
      />
    )
  }

  if (isCreationTxInfo(txInfo)) {
    return (
      <TxCreationCard
        onPress={onCardPress}
        executionInfo={tx.executionInfo}
        inQueue={inQueue}
        bordered={bordered}
        txInfo={txInfo}
      />
    )
  }

  if (isCancellationTxInfo(txInfo)) {
    return (
      <TxRejectionCard
        onPress={onCardPress}
        executionInfo={tx.executionInfo}
        inQueue={inQueue}
        bordered={bordered}
        txInfo={txInfo}
      />
    )
  }

  if (isMultiSendTxInfo(txInfo) || isCustomTxInfo(txInfo)) {
    return (
      <TxContractInteractionCard
        executionInfo={tx.executionInfo}
        onPress={onCardPress}
        inQueue={inQueue}
        bordered={bordered}
        txInfo={txInfo}
      />
    )
  }

  if (isSwapOrderTxInfo(txInfo)) {
    return (
      <TxSwapCard
        bordered={bordered}
        onPress={onCardPress}
        executionInfo={tx.executionInfo}
        inQueue={inQueue}
        txInfo={txInfo}
      />
    )
  }

  return <></>
}

export const TxInfo = React.memo(TxInfoComponent, (prevProps, nextProps) => {
  return prevProps.tx.txHash === nextProps.tx.txHash
})
